/**
 * 어휘 레벨 진단 — 타이핑 힌트 생성 (순수 함수, 클라이언트/서버 공용 가능).
 * 형식: 뜻 제시 → 첫 글자+밑줄 힌트 타이핑 (2026-08-06 사장님 확정).
 */

/**
 * 타이핑 힌트 — 단어(공백 구분)마다 첫 글자만 남기고 나머지 알파벳은 _로 마스킹.
 * 아포스트로피·하이픈은 그대로 노출한다 (don't → d__'_).
 */
export function buildTypingHint(front: string): string {
  return front
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('')
        .map((ch, i) => (i === 0 || !/[A-Za-z]/.test(ch) ? ch : '_'))
        .join(''),
    )
    .join(' ');
}

/** 단일 단어만 — 영문자·하이픈·아포스트로피 (공백 불허) */
const TYPEABLE_CHARS = /^[A-Za-z][A-Za-z'-]*$/;
/** 문법 패턴 표기 — "v-ing", "-ing" 등. 단어가 아니라 철자 입력 문제로 내면 안 된다 */
const GRAMMAR_PATTERN = /-(ing|v)\b|\bv-/;

/**
 * 타이핑 출제 가능한 표제어인가 — 단일 단어만 (2026-08-06 사장님: 숙어·구동사는 스펠링
 * 시험에서 제외). 공백 포함 표제어(watch out for, do one's best 등)와 문법 패턴 표기는
 * 5지선다로만 출제된다. part-time 같은 하이픈 복합어는 한 단어로 보고 허용.
 */
export function isTypeableFront(front: string): boolean {
  const t = front.trim();
  return TYPEABLE_CHARS.test(t) && !GRAMMAR_PATTERN.test(t);
}
