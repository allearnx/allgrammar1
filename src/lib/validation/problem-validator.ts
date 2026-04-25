import type { NaesinProblemQuestion } from '@/types/naesin';

// ── Constants ──

const CIRCLED_TO_DIGIT: Record<string, string> = {
  '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5', '⑥': '6',
};
const CIRCLED_PATTERN = /^[①②③④⑤⑥]$/;

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

    // Nested array options check
    if (isMcq && q.options!.some((opt) => Array.isArray(opt))) {
      issues.push(issue('error', n, 'NESTED_ARRAY_OPTION', `${n}번: 선지에 배열이 포함되어 있습니다. 문자열이어야 합니다.`));
    }

    // Circled number answer format (⑤ instead of "5")
    if (typeof q.answer === 'string' && CIRCLED_PATTERN.test(q.answer)) {
      issues.push(issue('warning', n, 'CIRCLED_ANSWER', `${n}번: 정답이 원문자(${q.answer})입니다. 숫자로 정규화 필요.`));
    }

    // Circled number options without markers in question text
    if (isMcq && q.options!.every((opt) => CIRCLED_PATTERN.test(String(opt)))) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fullText = (q.question || '') + ' ' + ((q as any).passage || '');
      if (!/[①②③④⑤⑥]/.test(fullText)) {
        issues.push(issue('error', n, 'CIRCLED_OPTIONS_NO_MARKERS',
          `${n}번: 선지가 ①②③④⑤인데 지문에 번호 마커가 없습니다.`));
      }
    }

    // Answer-explanation mismatch checks
    if (q.explanation && isMcq) {
      const exp = q.explanation;
      const ansStr = String(q.answer);

      // "따라서 N번" — but NOT "N번째" (word position, not answer)
      const thereforeMatch = exp.match(/따라서\s*(\d)번(?!째)/);
      if (thereforeMatch && thereforeMatch[1] !== ansStr) {
        issues.push(issue('warning', n, 'ANSWER_EXP_THEREFORE',
          `${n}번: 해설 "따라서 ${thereforeMatch[1]}번" ≠ 등록 정답 ${ansStr}`));
      }

      // "정답은 ①②③④⑤"
      const circleMap: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
      const circleMatch = exp.match(/정답[은는이가]?\s*[①②③④⑤]/);
      if (circleMatch) {
        const expNum = circleMap[circleMatch[0].slice(-1)];
        if (expNum && expNum !== ansStr) {
          issues.push(issue('warning', n, 'ANSWER_EXP_CIRCLED',
            `${n}번: 해설 "정답 ${circleMatch[0].slice(-1)}" ≠ 등록 정답 ${ansStr}`));
        }
      }
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

// ── Pre-save sanitization ──

/**
 * Sanitize questions before saving to DB.
 * - Normalize circled number answers (⑤ → "5")
 * - Flatten nested array options to strings
 * - Sync answer_key with questions[].answer
 * Returns the sanitized questions array and answer_key.
 */
export function sanitizeQuestions(
  questions: NaesinProblemQuestion[],
  answerKey?: (string | number | null)[],
): { questions: NaesinProblemQuestion[]; answerKey: (string | number | null)[] } {
  const sanitized = questions.map((q) => {
    const out = { ...q };

    // Normalize circled answer → digit
    if (typeof out.answer === 'string' && CIRCLED_PATTERN.test(out.answer)) {
      out.answer = CIRCLED_TO_DIGIT[out.answer] ?? out.answer;
    }

    // Flatten nested array options
    if (Array.isArray(out.options)) {
      out.options = out.options.map((opt) => {
        if (Array.isArray(opt)) {
          return opt.map((item, i) => `(${String.fromCharCode(65 + i)}) ${item}`).join(' — ');
        }
        return String(opt);
      });
    }

    return out;
  });

  // Rebuild answer_key from questions
  const newAnswerKey = sanitized.map((q) => q.answer ?? null);

  return { questions: sanitized, answerKey: newAnswerKey };
}
