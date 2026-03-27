import type { NaesinProblemQuestion } from '@/types/naesin';

// ── Types ──

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  questionNumber: number | null; // null = sheet-level
  code: string;
  message: string;
}

export interface StructuralValidationResult {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}

// ── Helpers ──

function issue(
  severity: IssueSeverity,
  questionNumber: number | null,
  code: string,
  message: string,
): ValidationIssue {
  return { severity, questionNumber, code, message };
}

// ── Main ──

export function validateProblemStructure(
  questions: NaesinProblemQuestion[],
  expectedMcq?: number,
  expectedSubjective?: number,
): StructuralValidationResult {
  const issues: ValidationIssue[] = [];

  if (!questions || questions.length === 0) {
    issues.push(issue('error', null, 'EMPTY_SET', '문제가 없습니다.'));
    return { valid: false, errorCount: 1, warningCount: 0, issues };
  }

  const seenNumbers = new Set<number>();
  const seenTexts = new Set<string>();
  const answerDistribution: Record<number, number> = {};
  let mcqCount = 0;
  let subjectiveCount = 0;

  for (const q of questions) {
    const n = q.number;

    // Required fields
    if (n == null) {
      issues.push(issue('error', null, 'MISSING_NUMBER', '문제 번호가 없습니다.'));
      continue;
    }
    if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
      issues.push(issue('error', n, 'MISSING_QUESTION', `${n}번: 문제 텍스트가 비어있습니다.`));
    }
    if (q.answer == null || (typeof q.answer === 'string' && q.answer.trim() === '')) {
      issues.push(issue('error', n, 'MISSING_ANSWER', `${n}번: 정답이 비어있습니다.`));
    }

    // Duplicate number
    if (seenNumbers.has(n)) {
      issues.push(issue('error', n, 'DUPLICATE_NUMBER', `${n}번: 번호가 중복됩니다.`));
    }
    seenNumbers.add(n);

    // Duplicate question text
    const normText = (q.question || '').trim().toLowerCase();
    if (normText && seenTexts.has(normText)) {
      issues.push(issue('warning', n, 'DUPLICATE_TEXT', `${n}번: 동일한 문제 텍스트가 중복됩니다.`));
    }
    if (normText) seenTexts.add(normText);

    // MCQ-specific checks
    const isMcq = Array.isArray(q.options) && q.options.length > 0;
    if (isMcq) {
      mcqCount++;
      if (q.options!.length !== 5) {
        issues.push(issue('error', n, 'WRONG_OPTION_COUNT', `${n}번: 보기가 ${q.options!.length}개입니다. (5개 필요)`));
      }

      // Check for empty options
      for (let oi = 0; oi < q.options!.length; oi++) {
        if (!q.options![oi] || q.options![oi].trim() === '') {
          issues.push(issue('error', n, 'EMPTY_OPTION', `${n}번: ${oi + 1}번 보기가 비어있습니다.`));
        }
      }

      // MCQ answer should be 1-5
      const answerNum = typeof q.answer === 'number' ? q.answer : Number(q.answer);
      if (!Number.isNaN(answerNum) && answerNum >= 1 && answerNum <= 5) {
        answerDistribution[answerNum] = (answerDistribution[answerNum] || 0) + 1;
      } else if (typeof q.answer === 'string') {
        // Answer could be text — check if it matches an option
        const matchIdx = q.options!.findIndex(
          (opt) => opt.trim().toLowerCase() === q.answer.toString().trim().toLowerCase(),
        );
        if (matchIdx === -1) {
          issues.push(issue('warning', n, 'ANSWER_NOT_IN_OPTIONS', `${n}번: 정답이 보기에 없습니다.`));
        }
      }
    } else {
      // Subjective
      subjectiveCount++;
      if (q.options != null && (!Array.isArray(q.options) || q.options.length > 0)) {
        issues.push(issue('warning', n, 'SUBJECTIVE_HAS_OPTIONS', `${n}번: 서술형인데 보기가 있습니다.`));
      }
      if (typeof q.answer !== 'string') {
        issues.push(issue('warning', n, 'SUBJECTIVE_NUMERIC_ANSWER', `${n}번: 서술형인데 정답이 숫자입니다.`));
      }
    }

    // Explanation warning
    if (!q.explanation || q.explanation.trim() === '') {
      issues.push(issue('warning', n, 'NO_EXPLANATION', `${n}번: 해설이 없습니다.`));
    }
  }

  // Number sequence check
  const sortedNumbers = [...seenNumbers].sort((a, b) => a - b);
  for (let i = 0; i < sortedNumbers.length; i++) {
    if (sortedNumbers[i] !== i + 1) {
      issues.push(issue('warning', null, 'NUMBER_GAP', `번호가 순서대로가 아닙니다. (${sortedNumbers.join(', ')})`));
      break;
    }
  }

  // Answer distribution bias (MCQ only)
  if (mcqCount >= 10) {
    const threshold = mcqCount * 0.25;
    for (const [num, count] of Object.entries(answerDistribution)) {
      if (count > threshold) {
        issues.push(
          issue('warning', null, 'ANSWER_BIAS', `정답 ${num}번이 ${count}개로 편향되었습니다. (25% 초과: ${Math.round((count / mcqCount) * 100)}%)`),
        );
      }
    }
  }

  // Expected count checks
  if (expectedMcq != null && mcqCount !== expectedMcq) {
    issues.push(issue('warning', null, 'MCQ_COUNT_MISMATCH', `객관식 ${mcqCount}문제 (예상: ${expectedMcq})`));
  }
  if (expectedSubjective != null && subjectiveCount !== expectedSubjective) {
    issues.push(issue('warning', null, 'SUBJECTIVE_COUNT_MISMATCH', `서술형 ${subjectiveCount}문제 (예상: ${expectedSubjective})`));
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    valid: errorCount === 0,
    errorCount,
    warningCount,
    issues,
  };
}
