import { sameBank } from './word-bank-sets';

/** 연속 문항이 같은 공통 지문/보기 상자를 공유하는지 */
export function sharesPassage(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  // word bank 세트: 보기 단어 집합이 같으면 같은 세트 (소거법 유지 위해 안 쪼갬)
  if (sameBank(a, b)) return true;
  // 공통 지문: 긴 공통 접두사 휴리스틱
  const qa = String(a?.question ?? '');
  const qb = String(b?.question ?? '');
  if (qa.length < 120 || qb.length < 120) return false;
  return qa.slice(0, 100) === qb.slice(0, 100);
}

/** 청크 분할 — 같은 지문을 공유하는 연속 문항 그룹은 경계에서 쪼개지 않음 */
export function chunkPreservingGroups(qs: Record<string, unknown>[], size: number): Record<string, unknown>[][] {
  const chunks: Record<string, unknown>[][] = [];
  let i = 0;
  while (i < qs.length) {
    let end = Math.min(i + size, qs.length);
    while (end < qs.length && sharesPassage(qs[end - 1], qs[end])) end++;
    chunks.push(qs.slice(i, end));
    i = end;
  }
  return chunks;
}
