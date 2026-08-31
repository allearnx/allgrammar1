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

/** 같은 그룹(지시문·지문·보기 상자 공유) 판별 — 절반 추출의 교대 리셋 기준 */
export function sameGroup(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  if (sharesPassage(a, b)) return true;
  // 같은 지시문(첫 줄 동일)을 공유하는 연속 드릴 묶음
  const la = String(a?.question ?? '').split('\n', 1)[0].trim();
  const lb = String(b?.question ?? '').split('\n', 1)[0].trim();
  return la.length >= 8 && la === lb;
}

/** 절반 추출: 그룹별로 1·3·5번째 문항만 유지 (전역 홀수가 아니라 묶음 단위 교대 —
 *  모든 유형 묶음이 최소 1문항 남고, 지시문은 문항마다 복제돼 있어 유실되지 않음).
 *  워크북처럼 같은 유형이 대량 반복되는 자료에서 문항 수·비용·학생 부담을 절반화.
 *  word bank 세트는 변형 후 rebuildBankSets가 남은 문항 정답으로 [보기]를 재조립하므로
 *  절반만 남아도 소거법이 성립한다. */
export function thinAlternate(qs: Record<string, unknown>[]): Record<string, unknown>[] {
  const kept: Record<string, unknown>[] = [];
  let posInGroup = 0;
  for (let i = 0; i < qs.length; i++) {
    if (i > 0 && sameGroup(qs[i - 1], qs[i])) posInGroup++;
    else posInGroup = 0;
    if (posInGroup % 2 === 0) kept.push(qs[i]);
  }
  return kept;
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
