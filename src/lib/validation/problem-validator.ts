import type { NaesinProblemQuestion } from '@/types/naesin';

// ── Constants ──

const CIRCLED_TO_DIGIT: Record<string, string> = {
  '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
  '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10',
};
const CIRCLED_PATTERN = /^[①②③④⑤⑥⑦⑧⑨⑩]$/;
const CIRCLED_GLOBAL = /[①②③④⑤⑥⑦⑧⑨⑩]/g;
// 비전역(stateless) — .test() 루프에서 lastIndex 부작용 없이 "원형숫자 포함 여부" 판별용
const CIRCLED_ANYWHERE = /[①②③④⑤⑥⑦⑧⑨⑩]/;

// PDF 추출 아티팩트
const SUPERSCRIPT_NUMBERS = /[⁰¹²³⁴⁵⁶⁷⁸⁹]+[⁾)]\s*/g;

const CIRCLED_BY_INDEX = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

/** 보기 텍스트 앞의 "자기 번호" 접두사(① / 1. / 1)) 제거.
 *  화면이 보기 번호를 자동 표시하므로 텍스트에 남으면 "① ① fresh"처럼 이중 표기됨.
 *  전 보기가 각자 자기 인덱스 번호로 시작하고 제거 후에도 내용이 남을 때만 발동
 *  (조합형 보기 "①③" 오변형 방지 — 인덱스 불일치로 자동 미발동). */
/** 오류 수정형 "틀린형 → 고친형" 화살표 쌍 정답을 고친 형태만으로 정규화.
 *  "※ 고친 부분만 쓰시오" 지시에 학생은 고친 형태만 입력하므로 쌍이 저장되면 전원 오답.
 *  고치기 맥락(고치/고쳐/바르게) + 화살표 1개일 때만 우측으로 교체 (복수 쌍은 의도 불명이라 보존). */
export function fixArrowPairAnswer(question: string, answer: string): string {
  const arrowMatch = answer.match(/^(.{1,80}?)\s*(?:→|➔|->)\s*(.+)$/);
  const arrowCount = (answer.match(/→|➔|->/g) || []).length;
  if (arrowMatch && arrowCount === 1 && /고치|고쳐|바르게/.test(question)) {
    return arrowMatch[2].trim();
  }
  return answer;
}

export function stripOptionSelfNumbering(options: string[]): string[] {
  const stripped = options.map((opt, i) => {
    if (typeof opt !== 'string') return null;
    const t = opt.trimStart();
    for (const prefix of [CIRCLED_BY_INDEX[i], `${i + 1}.`, `${i + 1})`]) {
      if (prefix && t.startsWith(prefix)) {
        const rest = t.slice(prefix.length).trim();
        if (rest) return rest;
      }
    }
    return null;
  });
  return stripped.every((s): s is string => s !== null) ? stripped : options;
}
const FFFD_CHAR = /\ufffd/g;

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

// 복수정답 누락 탐지: 해설에 등장하는 선택지 라벨(①-⑩, ⓐ-ⓩ, ㉠-㉤)
const OPTION_MARKER_RE = /[①-⑩ⓐ-ⓩ㉠-㉤]/g;
/** 조합형 보기 판별: 옵션이 "ⓐ, ⓒ"/"①, ④"처럼 마커 묶음만으로 된 경우.
 *  이런 문항은 "2개 고르면"이라도 정답이 단일 번호(맞는 쌍)이므로 누락이 아니다. */
function isComboOptionQuestion(options: string[]): boolean {
  // 마커: 원형숫자①-⑩, 원형영문ⓐ-ⓩ, 원형한글㉠-㉤, 한글자모ㄱ-ㅎ(보기 라벨 ㄱ.ㄴ.ㄷ.ㄹ.)
  const combo = options.filter((o) => {
    // 옵션이 순수 마커(+구분자)로만 구성되고 마커가 2개 이상 — "①③" "ⓐ, ⓒ" "ㄷ,ㄹ" 포함(구분자 유무 무관)
    if (!/^[\s①-⑩ⓐ-ⓩ㉠-㉤ㄱ-ㅎ,，·]+$/.test(o)) return false;
    return (o.match(/[①-⑩ⓐ-ⓩ㉠-㉤ㄱ-ㅎ]/g) || []).length >= 2;
  }).length;
  return combo >= Math.ceil(options.length / 2);
}
/** 문제 텍스트에서 "정답 N개"류 명시 개수를 추출. 없으면 null. */
function detectExpectedAnswerCount(qtext: string): number | null {
  let m: RegExpMatchArray | null;
  if ((m = qtext.match(/정답\s*(\d+)\s*개/))) return Number(m[1]);
  if ((m = qtext.match(/\(\s*(?:정답\s*)?(\d+)\s*개\s*\)/))) return Number(m[1]);
  if ((m = qtext.match(/(\d+)\s*개\s*(?:이상\s*)?(?:고르|선택|찾)/))) return Number(m[1]);
  if (/(?:^|[^가-힣\d])두\s*개/.test(qtext)) return 2;
  if (/(?:^|[^가-힣\d])세\s*개/.test(qtext)) return 3;
  return null;
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

// ── Post-generation auto-fix ──

/**
 * 해설(explanation)에서 정답 번호를 추출하여 answer 필드와 불일치하면 자동 교정.
 * AI가 "정답은 ③" 또는 "따라서 3번"이라고 썼는데 answer가 "2"인 경우 → answer를 "3"으로 수정.
 */
export function autoFixAnswers(
  questions: NaesinProblemQuestion[],
): { questions: NaesinProblemQuestion[]; fixCount: number } {
  let fixCount = 0;
  const fixed = questions.map((q) => {
    // Only auto-fix MCQ (has options)
    if (!Array.isArray(q.options) || q.options.length === 0) return q;
    if (!q.explanation) return q;

    const ansStr = String(q.answer ?? '');
    const exp = q.explanation;

    // Extract answer number from explanation patterns
    const inferredAnswer = inferAnswerFromExplanation(exp, q.options);
    if (!inferredAnswer || inferredAnswer === ansStr) return q;

    // Validate inferred answer is a valid option index
    const idx = parseInt(inferredAnswer, 10);
    if (isNaN(idx) || idx < 1 || idx > q.options.length) return q;

    fixCount++;
    return { ...q, answer: inferredAnswer };
  });

  return { questions: fixed, fixCount };
}

/** 해설 텍스트에서 정답 번호를 추론 */
function inferAnswerFromExplanation(explanation: string, options: string[]): string | null {
  const CIRCLE_MAP: Record<string, string> = {
    '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
  };

  // Pattern 1: "따라서 N번" (but not "N번째")
  const therefore = explanation.match(/따라서\s*(\d)번(?!째)/);
  if (therefore) return therefore[1];

  // Pattern 2: "정답은 ①②③④⑤"
  const circled = explanation.match(/정답[은는이가]?\s*([①②③④⑤])/);
  if (circled) return CIRCLE_MAP[circled[1]] ?? null;

  // Pattern 3: "정답은 N번"
  const answerNum = explanation.match(/정답[은는이가]?\s*(\d)번/);
  if (answerNum) return answerNum[1];

  // Pattern 4: explanation mentions a specific option text as correct
  // Find "~이(가) 정답" or "~이(가) 올바" pattern and match against options
  for (let i = 0; i < options.length; i++) {
    const optText = options[i].trim();
    if (optText.length < 2) continue;
    // Check if explanation explicitly mentions this option as the answer
    const escaped = optText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`${escaped}[이가은는]?\\s*(정답|올바|맞|적절)`);
    if (pattern.test(explanation)) return String(i + 1);
  }

  return null;
}

// ── Image reference detection ──

/** 이미지를 참조하는 지시문 패턴 (학생이 그림을 봐야 하는 경우) */
// 표(table)는 마크다운으로 재현 가능하므로 삭제 대상 아님 — 시각 자료(그림/사진/지도/그래프/차트)만.
const IMAGE_INSTRUCTION = /다음 그림|그림을 보고|그림을 참고|그림에 대한|그림과 일치|그림의 내용|그림이 의미|그림의 상황|그림을 설명|그림에 맞|그림을 묘사|그림을 표현|그림의 표현|그림과 주어진|그림 정보|사진을 보고|사진 속|표지판을 보고|표지판이 지시|지도를 보고|지도를 참고|그래프를 보고|그래프를 참고|차트를 보고|차트를 참고/;
/** 인라인 설명이 있으면 이미지 없이도 풀 수 있음 */
const HAS_INLINE_DESC = /\(그림[:\s：]|（그림[:\s：]|\[그림[:\s：]|\[이미지[:\s：]|그림 \d+[:\s：]|그림:\s|그림\s*\d+\s*:\s/;
/** "그림"이 내용의 일부인 경우 (제거하면 안 됨) */
const CONTENT_USAGE = /그림을 그리|그림을 잘|그린 그림|그림들을|그림이 있는|그림들의|그림 그리기|그림을 좋아|사진을 찍|사진을 올|그 사진/;

/** 이미지 없이 풀 수 없는 문항인지 판별 (추출 미리보기 사전 필터에서도 재사용) */
export function isUnanswerableImageQuestion(text: string): boolean {
  if (!IMAGE_INSTRUCTION.test(text)) return false;
  if (CONTENT_USAGE.test(text) && !text.startsWith('다음 그림')) return false;
  if (HAS_INLINE_DESC.test(text)) return false;
  if (/\([^)]*그림\)|\([^)]*표시\)|\([^)]*장면\)|\([^)]*모습\)/.test(text)) return false;
  return true;
}

// ── 공통 지문 자동 복제 ──
// "[N~M] 다음 글을 읽고…"처럼 여러 문항이 한 지문을 공유하면, 추출 모델(Haiku)이 지문을
// 세트의 첫 문항에만 넣고 "위 글/위 대화" 후속 문항엔 빠뜨리는 경우가 많다(프롬프트 규칙을
// 확률적으로만 따름). 후속 문항에 바로 앞 지문 보유 문항의 본문을 결정적으로 복사해 보정한다.
const REFERS_PASSAGE_ABOVE = /위\s*글|위\s*대화|윗글/;
/** 영어 단어 수(2글자+ 알파벳 토큰) */
function englishWordCount(text: string): number {
  return (text.match(/[A-Za-z]{2,}/g) || []).length;
}
/** 자체 지문(긴 영어 본문) 보유 여부 — 지문은 보통 40단어+, 후속 문항 stem은 30단어 미만 */
function hasOwnPassage(text: string): boolean {
  return englishWordCount(text) >= 40;
}
/** 지문 보유 문항에서 영어 본문 블록만 추출(선두 한국어 지시문 제외) */
function extractPassageBlock(text: string): string | null {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => englishWordCount(l) >= 6);
  if (start === -1) return null;
  return lines.slice(start).join('\n').trim() || null;
}

/**
 * 공통 지문 자동 복제. "위 글/위 대화"를 가리키는데 지문이 없는 문항에,
 * 직전(최근 LOOKBACK개 이내) 지문 보유 문항의 본문을 복사해 앞에 붙인다.
 * 이미 지문이 있으면(40단어+) 건드리지 않으므로 멱등.
 */
export function backfillSharedPassages(
  questions: NaesinProblemQuestion[],
): NaesinProblemQuestion[] {
  const LOOKBACK = 8;
  return questions.map((q, i) => {
    const text = q.question;
    if (typeof text !== 'string' || !REFERS_PASSAGE_ABOVE.test(text) || hasOwnPassage(text)) return q;
    for (let j = i - 1; j >= 0 && j >= i - LOOKBACK; j--) {
      const src = questions[j].question;
      if (typeof src === 'string' && hasOwnPassage(src)) {
        const passage = extractPassageBlock(src);
        if (passage) return { ...q, question: `${passage}\n\n${text}` };
        break;
      }
    }
    return q;
  });
}

// ── Pre-save sanitization ──

/**
 * Sanitize questions before saving to DB.
 * Step 7 검증 게이트: 자동 정규화 + 저장 전 차단.
 *
 * Auto-fix rules:
 * 1. ①-⑩ 원형숫자 → "1"-"10" 변환
 * 2. 배열 정답 (multi-select) → "1, 3" 콤마구분 문자열
 * 3. 객관식 텍스트 정답 → 선택지 번호로 자동 변환
 * 4. "N번 텍스트" 패턴에서 번호 추출
 * 5. 연속 원형숫자 ("①③") → "1, 3"
 * 6. 중첩 배열 선지 → 문자열로 평탄화
 * 7. answer_key를 questions[].answer에서 재구축
 * 8. 이미지 참조 문항 자동 삭제 (인라인 설명 없는 경우)
 */
export function sanitizeQuestions(
  questions: NaesinProblemQuestion[],
  answerKey?: (string | number | null)[],
): { questions: NaesinProblemQuestion[]; answerKey: (string | number | null)[] } {
  const sanitized = questions.map((q, qi) => {
    const out = { ...q };

    // PDF artifact cleanup: superscript numbering (¹⁾ ²⁵⁾) and U+FFFD replacement chars
    if (typeof out.question === 'string') {
      out.question = out.question.replace(SUPERSCRIPT_NUMBERS, '').replace(FFFD_CHAR, '');
    }
    if (typeof out.explanation === 'string') {
      out.explanation = out.explanation.replace(SUPERSCRIPT_NUMBERS, '').replace(FFFD_CHAR, '');
    }
    if (Array.isArray(out.options)) {
      out.options = out.options.map((opt) =>
        typeof opt === 'string' ? opt.replace(SUPERSCRIPT_NUMBERS, '').replace(FFFD_CHAR, '') : opt,
      );
    }

    // Backfill empty answer from answerKey (PDF extraction sometimes splits answer into answer_key only)
    if (answerKey && (!out.answer || (typeof out.answer === 'string' && out.answer.trim() === ''))) {
      const akVal = answerKey[qi];
      if (akVal != null && String(akVal).trim() !== '') {
        out.answer = String(akVal);
      }
    }

    const isMcq = Array.isArray(out.options) && out.options.length > 0;

    // Flatten nested array options first (needed for text→number matching)
    if (Array.isArray(out.options)) {
      out.options = out.options.map((opt) => {
        if (Array.isArray(opt)) {
          return opt.map((item, i) => `(${String.fromCharCode(65 + i)}) ${item}`).join(' — ');
        }
        return String(opt);
      });
      // Rule 9: 보기 자기번호 접두사 제거 ("① fresh" → "fresh") — 화면이 번호 자동 표시
      out.options = stripOptionSelfNumbering(out.options);
    }

    // Rule 2: Array answer (multi-select) → comma-separated string "1, 3"
    if (Array.isArray(out.answer)) {
      const parts = (out.answer as (string | number)[]).map((v) => {
        const s = String(v);
        return CIRCLED_PATTERN.test(s) ? (CIRCLED_TO_DIGIT[s] ?? s) : s;
      });
      out.answer = parts.join(', ');
    }

    if (typeof out.answer === 'string') {
      // Rule 5: Consecutive circled numbers "①③" → "1, 3"
      if (CIRCLED_GLOBAL.test(out.answer) && out.answer.length > 1) {
        out.answer = out.answer.replace(CIRCLED_GLOBAL, (ch) => CIRCLED_TO_DIGIT[ch] ?? ch);
        // If multiple digits were produced, separate with ", "
        if (/^\d+$/.test(out.answer) && out.answer.length > 1) {
          out.answer = [...out.answer].join(', ');
        }
      }
      // Rule 1: Single circled number → digit
      if (CIRCLED_PATTERN.test(out.answer)) {
        out.answer = CIRCLED_TO_DIGIT[out.answer] ?? out.answer;
      }
    }

    if (isMcq && typeof out.answer === 'string') {
      const ansStr = out.answer.trim();
      const ansNum = Number(ansStr);

      // Rule 6: 콤마 누락 복수정답 ("45" 선지5개) → 쉼표 삽입 ("4, 5")
      //   통째 숫자가 범위 밖이고 각 자릿수가 모두 유효 선지일 때만 (단일정답 "12"=12번 선지 오인 방지)
      //   쉼표가 있어야 학생 UI가 복수선택(두 개 클릭)으로 렌더됨 — answerHasComma 판정
      if (/^\d{2,}$/.test(ansStr) && (ansNum < 1 || ansNum > out.options!.length)) {
        const digits = [...ansStr].map(Number);
        if (digits.every((d) => d >= 1 && d <= out.options!.length)) {
          out.answer = digits.join(', ');
        }
      }

      // Rule 4: "N번 텍스트" or "N. 텍스트" pattern → extract N
      const numPrefixMatch = ansStr.match(/^(\d+)\s*[번.)]\s*.+/);
      if (numPrefixMatch) {
        const n = parseInt(numPrefixMatch[1], 10);
        if (n >= 1 && n <= out.options!.length) {
          out.answer = String(n);
        }
      }

      // Rule 3: Text answer → option number (when answer is text, not a valid number)
      if (isNaN(ansNum) || ansNum < 1 || ansNum > out.options!.length) {
        const matchIdx = out.options!.findIndex(
          (opt) => opt.trim().toLowerCase() === out.answer.toString().trim().toLowerCase(),
        );
        if (matchIdx !== -1) {
          out.answer = String(matchIdx + 1);
        }
      }
    }

    // Ensure numeric answer is stored as string for consistency
    if (typeof out.answer === 'number') {
      out.answer = String(out.answer);
    }

    // Rule 10: 오류 수정형 "틀린형 → 고친형" 화살표 쌍 정답 정규화.
    if (!isMcq && typeof out.answer === 'string') {
      out.answer = fixArrowPairAnswer(
        typeof out.question === 'string' ? out.question : '',
        out.answer,
      );
    }

    // Auto-generate acceptedAnswers for common format variants (서술형만)
    if (!isMcq && typeof out.answer === 'string' && out.answer.length > 0) {
      const answer = out.answer;
      const accepted = out.acceptedAnswers ? [...out.acceptedAnswers] : [];

      // Variant: without trailing period
      if (answer.endsWith('.')) {
        const noPeriod = answer.slice(0, -1);
        if (!accepted.includes(noPeriod)) accepted.push(noPeriod);
      }

      // Variant: slash spacing ("A / B" ↔ "A/B")
      if (answer.includes(' / ')) {
        const noSlashSpace = answer.replace(/ \/ /g, '/');
        if (!accepted.includes(noSlashSpace)) accepted.push(noSlashSpace);
      }

      // Variant: parenthesis spacing ("(1) text" ↔ "(1)text")
      if (/\(\d+\)\s/.test(answer)) {
        const noParenSpace = answer.replace(/\((\d+)\)\s/g, '($1)');
        if (!accepted.includes(noParenSpace)) accepted.push(noParenSpace);
      }

      if (accepted.length > (out.acceptedAnswers?.length ?? 0)) {
        out.acceptedAnswers = accepted;
      }

      // Auto-subParts: 슬래시 구분 복합 답안 → subParts 자동 분할
      // "A / B / C" → subParts: [{label:"(1)", answer:"A"}, {label:"(2)", answer:"B"}, ...]
      if (answer.includes(' / ') && !out.subParts?.length) {
        const parts = answer.split(' / ').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          out.subParts = parts.map((part, idx) => ({
            label: `(${idx + 1})`,
            answer: part,
          }));
        }
      }
    }

    return out;
  });

  // Rule 9: 공통 지문 자동 복제 (LLM이 후속 문항에 지문을 안 넣은 경우 보정)
  const withPassages = backfillSharedPassages(sanitized);

  // Rule 8: Remove unanswerable image-referencing questions (no inline description)
  const filtered = withPassages.filter((q) => {
    const text = q.question || '';
    return !isUnanswerableImageQuestion(text);
  });

  // Renumber after filtering
  const renumbered = filtered.map((q, i) => ({ ...q, number: i + 1 }));

  // Rebuild answer_key from questions
  const newAnswerKey = renumbered.map((q) => q.answer ?? null);

  return { questions: renumbered, answerKey: newAnswerKey };
}

// ── Pre-save validation gate ──

export interface SaveValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Validate questions AFTER sanitization, BEFORE saving to DB.
 * Returns blocking errors and non-blocking warnings.
 * Called by POST/PATCH endpoints to reject invalid data.
 */
export function validateBeforeSave(
  questions: NaesinProblemQuestion[],
): SaveValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!questions || questions.length === 0) {
    return { valid: true, errors: [], warnings: [] }; // empty sheet is ok (PDF-only mode)
  }

  for (const q of questions) {
    const n = q.number;
    if (n == null) continue;

    const isMcq = Array.isArray(q.options) && q.options.length > 0;
    const hasQuestion = q.question && typeof q.question === 'string' && q.question.trim() !== '';

    // ERROR: question text exists but answer is empty
    if (hasQuestion && (q.answer == null || (typeof q.answer === 'string' && q.answer.trim() === ''))) {
      errors.push(issue('error', n, 'EMPTY_ANSWER', `${n}번: 문제는 있는데 정답이 비어있습니다.`));
    }

    if (isMcq && q.answer != null) {
      const ansStr = String(q.answer).trim();

      // Multi-select check (comma-separated)
      if (ansStr.includes(',')) {
        const parts = ansStr.split(',').map((p) => p.trim());
        for (const p of parts) {
          const num = parseInt(p, 10);
          if (isNaN(num) || num < 1 || num > q.options!.length) {
            errors.push(issue('error', n, 'MCQ_RANGE', `${n}번: 복수정답 "${p}"이(가) 선택지 범위(1-${q.options!.length})를 벗어납니다.`));
          }
        }
      } else {
        // Single answer
        const ansNum = Number(ansStr);
        if (!isNaN(ansNum)) {
          // ERROR: MCQ answer out of range
          if (ansNum < 1 || ansNum > q.options!.length) {
            errors.push(issue('error', n, 'MCQ_RANGE', `${n}번: 정답 ${ansNum}이(가) 선택지 범위(1-${q.options!.length})를 벗어납니다.`));
          }
        } else {
          // Text answer that wasn't converted → can't grade this MCQ
          const matchIdx = q.options!.findIndex(
            (opt) => opt.trim().toLowerCase() === ansStr.toLowerCase(),
          );
          if (matchIdx === -1) {
            errors.push(issue('error', n, 'TEXT_NOT_IN_OPTIONS', `${n}번: 텍스트 정답 "${ansStr.slice(0, 30)}"이(가) 어떤 선택지와도 일치하지 않습니다.`));
          }
        }
      }

      // ERROR: 복수정답 문항("모두 고르면"/"정답 N개")인데 정답 개수 부족
      //   PDF 추출이 반복적으로 정답을 1개만 저장하던 패턴(Lesson3·Step3·Lesson4 등 다수).
      //   신호1: 문제에 명시 개수("정답 2개" 등) → 정답수가 그보다 적으면 오탐0 확정.
      //   신호2: "모두 고르면" + 정답 1개 + 해설이 선택지 라벨 2개 이상 지목 → 교차검증.
      if (!isComboOptionQuestion(q.options!)) {
        const numAns = ansStr.split(',').map((p) => p.trim()).filter((p) => /^\d+$/.test(p)).length;
        const qtext = q.question || '';
        const expected = detectExpectedAnswerCount(qtext);
        if (expected != null && expected >= 2 && numAns < expected) {
          warnings.push(issue('warning', n, 'MULTI_ANSWER_UNDERCOUNT', `${n}번: '정답 ${expected}개' 문항인데 정답이 ${numAns}개만 저장되어 있습니다.`));
        } else if (numAns === 1 && /모두\s*고르|모두\s*골|all that apply/i.test(qtext)) {
          // 해설이 "정확히 2개"의 선택지 라벨을 지목 → 2-정답 누락. (4~5개 지목은 보통
          // 단일정답인데 해설이 모든 보기를 설명하는 경우라 제외 — 오탐 방지.)
          const markers = new Set((q.explanation || '').match(OPTION_MARKER_RE) || []);
          if (markers.size === 2) {
            warnings.push(issue('warning', n, 'MULTI_ANSWER_UNDERCOUNT', `${n}번: '모두 고르면' 문항인데 정답이 1개입니다. 해설이 선택지 2개(${[...markers].join('·')})를 지목하고 있어 복수정답 누락이 의심됩니다.`));
          }
        }
      }

      // WARNING: empty options
      for (let oi = 0; oi < q.options!.length; oi++) {
        if (!q.options![oi] || q.options![oi].trim() === '') {
          warnings.push(issue('warning', n, 'EMPTY_OPTION', `${n}번: ${oi + 1}번 보기가 비어있습니다.`));
        }
      }
    }

    // WARNING: no explanation
    if (hasQuestion && (!q.explanation || q.explanation.trim() === '')) {
      warnings.push(issue('warning', n, 'NO_EXPLANATION', `${n}번: 해설이 없습니다.`));
    }

    // ERROR: subParts with empty answers
    if (q.subParts && Array.isArray(q.subParts)) {
      for (const sp of q.subParts) {
        if (!sp.answer) {
          errors.push(issue('error', n, 'EMPTY_SUBPART_ANSWER', `${n}번: subPart "${sp.label}" 정답이 비어있습니다.`));
        }
      }
    }

    // WARNING: U+FFFD replacement character (PDF 추출 깨진 문자)
    const fullJson = JSON.stringify(q);
    if (fullJson.includes('\ufffd')) {
      warnings.push(issue('warning', n, 'FFFD_CHAR', `${n}번: 깨진 문자(U+FFFD)가 포함되어 있습니다. PDF 추출 오류일 수 있습니다.`));
    }

    // WARNING: subjective without format hint (서술형인데 답안 형식 안내 없음)
    if (!isMcq && hasQuestion && q.answer && typeof q.answer === 'string') {
      const answer = q.answer;
      const questionText = q.question || '';
      // Multi-part answers (슬래시/쉼표 구분) without format hint
      const isMultiPart = answer.includes(' / ') || (answer.includes(',') && !/^\d+(,\s*\d+)*$/.test(answer));
      const hasFormatHint = /※|형식|구분|슬래시|쉼표/.test(questionText);
      if (isMultiPart && !hasFormatHint) {
        warnings.push(issue('warning', n, 'NO_FORMAT_HINT', `${n}번: 서술형 복합 답안인데 형식 안내(※)가 없습니다.`));
      }
    }

    // ERROR: 선택지는 있는데 문제 텍스트가 비어있음 (04-16 "선지만 있고 문제가 없어요")
    if (isMcq && !hasQuestion) {
      errors.push(issue('error', n, 'MISSING_QUESTION_TEXT', `${n}번: 선택지는 있는데 문제 텍스트가 비어있습니다.`));
    }

    // ERROR: 정답에 원형숫자(①②③)가 남아있음 → 학생은 "1"을 보내므로 채점 실패 (sanitize 누락 데이터)
    if (q.answer != null && CIRCLED_ANYWHERE.test(String(q.answer))) {
      errors.push(issue('error', n, 'CIRCLED_NUMBER', `${n}번: 정답에 원형숫자(①②③)가 남아있습니다. 숫자로 변환해야 채점됩니다.`));
    }

    // WARNING: 리터럴 "\n"(역슬래시+n 2글자)이 표시 필드에 포함 — 줄바꿈이 깨져 보임 (04-10 make Q25)
    //   실제 개행(U+000A)이 아니라 2글자 시퀀스만 탐지하므로 JSON.stringify를 쓰지 않음(개행도 \n으로 이스케이프되어 오탐)
    const displayFields = [q.question, q.explanation, ...(q.options ?? [])];
    if (displayFields.some((t) => typeof t === 'string' && t.includes('\\n'))) {
      warnings.push(issue('warning', n, 'LITERAL_BACKSLASH_N', `${n}번: 리터럴 "\\n"(2글자)이 포함되어 줄바꿈이 깨져 보일 수 있습니다.`));
    }

    // WARNING(quality): "밑줄 친"을 묻는데 <u> 표시가 없음 → 학생이 어디가 밑줄인지 모름.
    //   단, 지문에 ⓐ~ⓩ/(A)~(E)/㉠~㉤ 기호 마커가 있으면 그게 밑줄 표시 역할이라 면제(오탐 방지).
    if (hasQuestion && /밑줄\s*친|underlin/i.test(q.question!)) {
      const blob = (q.question || '') + ' ' + (q.options ?? []).join(' ');
      const hasMarker = /[ⓐ-ⓩ㉠-㉤]|\([A-E]\)/.test(q.question!);
      if (!/<u>/i.test(blob) && !hasMarker) {
        warnings.push(issue('warning', n, 'UNDERLINE_MISSING', `${n}번: "밑줄 친"을 묻는데 <u> 표시가 없습니다. 밑줄 대상을 <u>로 감싸야 학생이 풀 수 있습니다.`));
      }
    }

    // 참고: "공통 지문 추출 누락"(위 글/위 대화를 가리키는데 question에 지문 없음)은 검사로 두지 않음.
    //   라이브에 이미 광범위(900+ 참조 중 360+ 영어단어 0)해 검수 큐가 노이즈로 가득 참 → quality 검사 무의미.
    //   → 대신 추출 프롬프트(extract-pdf/images/paraphrase)에서 [N~M] 범위 공통 지문을 모든 문항에
    //      복제하도록 강제(forward 규칙). 기존 콘텐츠 일괄수정은 원본 PDF 재추출이 정석.

    // 참고: "빈칸 문제인데 정답이 문장 전체" 패턴은 검사로 두지 않음.
    //   한국어 지시문 변주(영작/배열/합치/전환/고쳐쓰기…)를 키워드로 못 갈라 오탐이 큼.
    //   → 대신 추출 프롬프트(extract-pdf/images/paraphrase)에서 생성 시점에 출력 형식을 명시하도록 강제 (forward 규칙).
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ── 시트 레벨 검사: answer_key 길이 ──
// validateBeforeSave는 questions[]만 보므로 answer_key 길이 불일치는 못 잡는다.
// sanitizeQuestions는 저장 시 answer_key를 풀 길이로 재구축하므로 정상 경로로는 발생 불가 —
// 이 검사는 sanitize를 우회한 stale/직접삽입 데이터를 잡는 용도 (RAW 데이터에 적용해야 의미 있음).
// 채점(submit)은 raw answer_key를 그대로 쓰고, 폴백은 answer_key가 "완전히 빈" 경우만 작동하므로
// answer_key가 부분적으로만 채워지면 뒤쪽 문항이 전원 오답 처리된다(박서윤 0점 버그 변종).
export function validateAnswerKey(
  questions: NaesinProblemQuestion[],
  answerKey: (string | number | null)[] | null | undefined,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!questions?.length || !Array.isArray(answerKey)) return issues;

  // 완전히 빈 answer_key([])는 submit이 questions[].answer로 폴백 → 버그 아님
  if (answerKey.length > 0 && answerKey.length < questions.length) {
    const atRisk = questions
      .slice(answerKey.length)
      .filter((q) => q.answer != null && String(q.answer).trim() !== '').length;
    issues.push(
      issue(
        'error',
        null,
        'PARTIAL_ANSWER_KEY',
        `answer_key가 ${answerKey.length}개로 문항 수(${questions.length})보다 짧습니다. 뒤쪽 ${atRisk}개 문항이 전원 오답 처리됩니다.`,
      ),
    );
  }
  return issues;
}
