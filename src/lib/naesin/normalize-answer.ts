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

/** 정규화: 대소문자 무시, 앞뒤 공백, 끝 마침표, 연속 공백 → 단일 공백 */
export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\.+\s*$/, '')
    .replace(/\s+/g, ' ');
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
  // 1차: 직접 비교 (둘 다 번호이거나 둘 다 텍스트인 경우)
  if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
    return true;
  }
  // 1.5차: 복수 정답 정규화 비교 ("1,3" vs "1, 3" vs "3, 1")
  if (correctAnswer.includes(',') || userAnswer.includes(',')) {
    if (normalizeMultiSelect(userAnswer) === normalizeMultiSelect(correctAnswer)) {
      return true;
    }
  }
  if (!options || options.length === 0) return false;
  // 2차: 학생 답이 번호이고 정답이 텍스트인 경우
  const idx = parseInt(userAnswer, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= options.length) {
    if (options[idx - 1].trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      return true;
    }
  }
  // 3차: 정답이 번호이고 학생 답이 텍스트인 경우
  const cidx = parseInt(correctAnswer, 10);
  if (!isNaN(cidx) && cidx >= 1 && cidx <= options.length) {
    if (options[cidx - 1].trim().toLowerCase() === userAnswer.trim().toLowerCase()) {
      return true;
    }
  }
  return false;
}

/**
 * 정답을 1-indexed 옵션 번호로 변환.
 * 이미 유효한 번호면 그대로, 텍스트면 매칭되는 옵션 번호를 반환.
 */
export function resolveCorrectIndex(correctAnswer: string, options: string[]): string {
  const num = parseInt(correctAnswer, 10);
  if (!isNaN(num) && num >= 1 && num <= options.length) return correctAnswer;
  const idx = options.findIndex(
    (opt) => opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
  );
  if (idx !== -1) return String(idx + 1);
  return correctAnswer;
}
