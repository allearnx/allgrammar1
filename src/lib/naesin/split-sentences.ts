/**
 * 지문을 문장 단위로 나눈다 — AI를 거치지 않으므로 글자가 한 자도 바뀌지 않는다.
 * (2026-09-23: AI 추출이 필기에 가려진 글자를 추측해 원문을 훼손한 사고 이후, 붙여넣기 경로용으로 추가)
 * 약어(Mr., e.g., U.S. 등)와 소수점에서 잘리지 않게 예외 처리.
 */
const ABBREV = /(?:Mr|Mrs|Ms|Dr|Prof|St|Jr|Sr|vs|etc|e\.g|i\.e|cf|approx|Inc|Ltd|Co|Fig|No|p|pp|Vol|U\.S|U\.K)\.$/i;

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!normalized) return [];

  const out: string[] = [];
  for (const para of normalized.split(/\n{1,}/)) {
    const chunk = para.trim();
    if (!chunk) continue;
    let buf = '';
    // 문장 종결부호 + (닫는 따옴표·괄호) + 공백 을 경계 후보로 본다
    const parts = chunk.split(/([.?!]+["'”’)\]]*\s+)/);
    for (let i = 0; i < parts.length; i += 2) {
      const body = parts[i] ?? '';
      const tail = parts[i + 1] ?? '';
      buf += body + tail;
      const trimmed = buf.trim();
      if (!tail) continue;                       // 마지막 조각
      if (ABBREV.test(trimmed)) continue;        // 약어면 이어 붙임
      if (/\b\d+\.$/.test(trimmed)) continue;    // 소수점·번호
      out.push(trimmed);
      buf = '';
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}

/** 한국어 해석도 같은 방식으로 나눈다 (종결부호 + 공백 기준) */
export function splitKorean(text: string): string[] {
  return splitSentences(text);
}
