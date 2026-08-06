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

/** 타이핑 출제 가능한 표제어 — 영문자·공백·하이픈·아포스트로피만 (슬래시 병기 등 변칙 제외) */
export const TYPEABLE_FRONT = /^[A-Za-z][A-Za-z' -]*$/;
