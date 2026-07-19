/**
 * 단어 저장 오염 방지 가드 (2026-07-19 사고).
 * AI 보강/추출 응답의 대화체 문장("새로 주신 단어 30개를 요청하신 형식(<영어…")이
 * 표제어로 저장되어 학생 화면에 노출될 뻔함 → 삽입 경로에서 표제어 형식을 검증한다.
 *
 * 허용: 영단어·구동사·숙어 (bring up, make up one's mind …) + 짧은 문형 표기
 *       ("willing to + 동사원형" 같은 한글 문법 용어 1~2개는 실제 콘텐츠에 존재 — 전면 금지 금지)
 * 거부: 한글 토큰 3개 이상(=한국어 문장), 한글 포함 장문, 7단어 이상, 50자 초과, 꺾쇠/중괄호 등 형식 문자
 */
const HANGUL = /[가-힣]/;
const FORMAT_CHARS = /[<>{}[\]|`"=]/;
const MAX_WORDS = 6;
const MAX_LENGTH = 50;
const MAX_HANGUL_TOKENS = 2;
const MAX_LENGTH_WITH_HANGUL = 30;

export function isValidFrontText(front: string): boolean {
  const t = front.trim();
  if (!t) return false;
  if (t.length > MAX_LENGTH) return false;
  if (FORMAT_CHARS.test(t)) return false;
  const tokens = t.split(/\s+/);
  if (tokens.length > MAX_WORDS) return false;
  if (HANGUL.test(t)) {
    const hangulTokens = tokens.filter((tok) => HANGUL.test(tok)).length;
    if (hangulTokens > MAX_HANGUL_TOKENS) return false;
    if (t.length > MAX_LENGTH_WITH_HANGUL) return false;
  }
  return true;
}

/** 대량 입력에서 오염 항목 필터링 — 유효분과 걸러진 표제어 목록을 함께 반환 */
export function filterVocabItems<T extends { front_text: string }>(
  items: T[],
): { valid: T[]; skipped: string[] } {
  const valid: T[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    if (isValidFrontText(item.front_text)) valid.push(item);
    else skipped.push(item.front_text.slice(0, 40));
  }
  return { valid, skipped };
}
