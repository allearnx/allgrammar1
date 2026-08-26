/**
 * answer_key 항목이 객체({ answer, number })일 때 answer 문자열만 추출.
 * 문자열/숫자면 그대로, 그 외는 빈 문자열 반환.
 */
export function extractAnswer(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && 'answer' in (val as Record<string, unknown>)) {
    return String((val as Record<string, unknown>).answer ?? '');
  }
  return '';
}

/** ①②③④⑤ → 1,2,3,4,5 변환 맵 */
const CIRCLED_TO_NUM: Record<string, string> = {
  '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
  '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10',
};

/** circled number(①②③④⑤)를 plain number로 변환. 연속된 경우 comma 구분 (①③→"1,3") */
export function uncircle(s: string): string {
  return s.replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (match) =>
    [...match].map((ch) => CIRCLED_TO_NUM[ch] ?? ch).join(','),
  );
}

/** 정규화: 대소문자 무시, 앞뒤 공백, 끝 마침표, 연속 공백 → 단일 공백 */
export function normalize(s: string): string {
  return s
    .replace(/[\r\n\t]/g, ' ')           // 개행/탭 → 공백
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'") // 곡선 작은따옴표 → 직선
    .replace(/[\u201C\u201D]/g, '"')     // 곡선 큰따옴표 → 직선
    .replace(/[\u2013\u2014\u2212]/g, '-') // 엔대시/엠대시 → 하이픈
    .trim()
    .toLowerCase()
    // 축약형 ↔ 비축약형 동등 처리: 학생/정답 양쪽에 같은 확장을 적용해 비교하므로
    // "It's ~"와 "It is ~", "isn't"와 "is not"이 서로 정답 인정됨 (동아윤 검수에서 확정).
    // 소유격 's는 확장하지 않도록 호스트를 대명사·의문사·there로 제한.
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bcan not\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/([a-z])n't\b/g, '$1 not')  // isn't/aren't/wasn't/don't/didn't...
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b(i|you|we|they|he|she|it|there|who|what)'ll\b/g, '$1 will')
    .replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
    .replace(/\b(it|that|there|he|she|what|who|where|when|how|here)'s\b/g, '$1 is')
    .replace(/\.+\s*$/, '')              // 끝 마침표 제거
    .replace(/\((\d+)\)\s*/g, '($1) ')   // (1)that → (1) that 통일
    .replace(/\s*\/\s*/g, ' / ')         // A/B, A /B → A / B 통일
    .replace(/\s+/g, ' ')               // 연속 공백 → 단일
    .trim();                             // 슬래시 정규화 후 trim 재적용
}

/** 구분자(쉼표, 슬래시) 무시 비교용 정규화 */
export function normalizeSeparators(s: string): string {
  return normalize(s)
    .replace(/\s*[,/]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 복수 정답(예: "1,3" / "1, 3" / "3, 1") 정규화: 공백 제거 + 숫자 정렬 */
function normalizeMultiSelect(s: string): string {
  const parts = s.split(',').map((v) => v.trim());
  if (parts.length <= 1) return s.trim().toLowerCase();
  // All parts are integers → sort numerically
  if (parts.every((p) => /^\d+$/.test(p))) {
    return parts.sort((a, b) => Number(a) - Number(b)).join(', ');
  }
  return parts.map((p) => p.toLowerCase()).sort().join(', ');
}

/**
 * 객관식 정답 매칭: 학생 답(1-indexed 번호)이 정답과 일치하는지 확인.
 * 정답이 번호가 아닌 텍스트로 저장된 경우도 처리한다.
 * 복수 정답(모두고르기)도 정규화하여 비교한다.
 */
export function matchMcqAnswer(
  userAnswer: string,
  correctAnswer: string,
  options?: string[],
): boolean {
  // 0차: circled number 변환 (①→1, ②→2, ...)
  const uPlain = uncircle(userAnswer).trim().toLowerCase();
  const cPlain = uncircle(correctAnswer).trim().toLowerCase();

  // 1차: 직접 비교 (circled number 변환 후)
  if (uPlain === cPlain) {
    return true;
  }
  // 1.5차: 복수 정답 정규화 비교 ("1,3" vs "1, 3" vs "3, 1" vs "①③")
  if (cPlain.includes(',') || uPlain.includes(',')) {
    if (normalizeMultiSelect(uPlain) === normalizeMultiSelect(cPlain)) {
      return true;
    }
  }
  if (!options || options.length === 0) return false;
  // 2차: 학생 답이 번호이고 정답이 텍스트인 경우
  const idx = parseInt(uPlain, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= options.length) {
    if (options[idx - 1].trim().toLowerCase() === cPlain) {
      return true;
    }
  }
  // 3차: 정답이 번호이고 학생 답이 텍스트인 경우
  const cidx = parseInt(cPlain, 10);
  if (!isNaN(cidx) && cidx >= 1 && cidx <= options.length) {
    if (options[cidx - 1].trim().toLowerCase() === uPlain) {
      return true;
    }
  }
  return false;
}

/**
 * 서술형 부분 일치: 학생 답이 정답의 앞부분/뒷부분과 일치하면 정답 처리.
 * 배열 문제에서 괄호 안 단어만 배열하고 나머지 고정 텍스트를 생략한 경우를 커버.
 * 조건: 학생 답 3단어 이상 + 정답 단어 수의 35% 이상.
 */
export function isSubstringMatch(student: string, correct: string): boolean {
  const s = normalize(student);
  const c = normalize(correct);

  if (s === c) return true;

  const sWords = s.split(' ');
  const cWords = c.split(' ');

  if (sWords.length < 3) return false;

  // 학생 답이 정답의 prefix 또는 suffix
  if (c.startsWith(s) || c.endsWith(s)) {
    return sWords.length / cWords.length >= 0.35;
  }

  // 정답이 학생 답의 prefix 또는 suffix (학생이 더 많이 쓴 경우)
  if (s.startsWith(c) || s.endsWith(c)) {
    return cWords.length / sWords.length >= 0.35;
  }

  // 번호 접두사를 제거한 비교: "(1) that (2) it" → "that / it" vs "that it that"
  const sNoBrackets = s.replace(/\(\d+\)\s*/g, '').replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const cNoBrackets = c.replace(/\(\d+\)\s*/g, '').replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (sNoBrackets === cNoBrackets && sNoBrackets.split(' ').length >= 2) {
    return true;
  }

  return false;
}

/**
 * 정답을 1-indexed 옵션 번호로 변환.
 * 이미 유효한 번호면 그대로, 텍스트면 매칭되는 옵션 번호를 반환.
 */
export function resolveCorrectIndex(correctAnswer: string, options: string[]): string {
  const plain = uncircle(correctAnswer);
  const num = parseInt(plain, 10);
  if (!isNaN(num) && num >= 1 && num <= options.length) return plain;
  const idx = options.findIndex(
    (opt) => opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
  );
  if (idx !== -1) return String(idx + 1);
  return correctAnswer;
}
