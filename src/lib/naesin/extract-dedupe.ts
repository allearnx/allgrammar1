/**
 * 분할 추출 결과의 중복 제거 — 조각끼리 1페이지씩 겹치므로 경계 문항이 두 조각에서 나올 수 있다.
 * 두 조각이 같은 문항을 추출해도 지시문·각주 번호("early.1)") 유무로 텍스트가 조금 달라지므로
 * 영문 본문 꼬리 + 정답 + 보기로 비교한다.
 */
export type ExtractedQ = Record<string, unknown>;

const normalize = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');

/** 문항 동일성 키. 영문 단어(2자 이상)만 이어붙여 한글 지시문 속 낱글자(O/X)·각주 숫자를 배제한다. */
export function extractDedupKey(q: ExtractedQ): string {
  const en = (String(q.question ?? '').match(/[a-zA-Z]{2,}/g) || []).join('').toLowerCase();
  const base = en.length >= 15 ? en.slice(-80) : normalize(q.question).slice(-80);
  const opts = Array.isArray(q.options) ? normalize(q.options.join('')).slice(0, 80) : '';
  return `${base}|${normalize(q.answer)}|${opts}`;
}

/** 조각별 추출 결과를 순서대로 합치고 같은 키의 뒤 문항을 버린다. */
export function dedupeExtractedChunks(chunks: ExtractedQ[][]): { questions: ExtractedQ[]; deduped: number } {
  const seen = new Set<string>();
  const all = chunks.flat();
  const questions = all.filter((q) => {
    const k = extractDedupKey(q);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { questions, deduped: all.length - questions.length };
}
