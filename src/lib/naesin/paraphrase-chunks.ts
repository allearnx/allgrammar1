import { sameBank, bankWords } from './word-bank-sets';

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

/** 절반 추출의 그룹 키 — 같은 유형 묶음을 전역으로 묶는다 (연속 여부 무관).
 *  첫 줄 완전 일치 방식은 추출 과정의 표현 편차·지시문+문장 한 줄 결합에 끊겨
 *  347문항 중 266문항이 유지된 실사례가 있어, 키 기반으로 전환. */
export function thinGroupKey(q: Record<string, unknown>): string | null {
  const question = String(q?.question ?? '');
  // word bank 세트: 보기 단어 집합
  const bank = bankWords(q);
  if (bank) return 'bank:' + bank.map((w) => w.toLowerCase()).sort().join('/');
  // 공통 지문: 긴 본문의 앞 100자
  if (question.length >= 120) return 'passage:' + question.slice(0, 100);
  const first = question.split('\n', 1)[0].trim().replace(/\s+/g, ' ');
  // 한국어 지시문 부분(첫 영문·괄호 전까지) — "다음 빈칸에 알맞은 말을 쓰시오. There ___" 도 묶임
  const korean = (first.match(/^[^A-Za-z([]*/) || [''])[0].trim();
  if (korean.length >= 8) return 'instr:' + korean;
  // 영어 지시문 등: 첫 줄 앞 40자
  if (first.length >= 12) return 'line:' + first.slice(0, 40);
  return null; // 판별 불가 (지시문 없는 짧은 문항 등) — 삭제 대상
}

/** 절반 추출: 그룹(지시문·지문·보기 상자)별로 1·3·5번째 문항만 유지.
 *  모든 유형 묶음이 최소 1문항 남고, 지시문은 문항마다 복제돼 있어 유실되지 않음.
 *  그룹 판별이 애매한 문항(지시문 없는 짧은 문항 등)은 삭제 — 유형별 문항이 충분하므로
 *  애매한 쪽을 남기기보다 버리는 것이 안전 (사장님 확정).
 *  word bank 세트는 변형 후 rebuildBankSets가 남은 문항 정답으로 [보기]를 재조립하므로
 *  절반만 남아도 소거법이 성립한다. */
export function thinAlternate(qs: Record<string, unknown>[]): Record<string, unknown>[] {
  const counts = new Map<string, number>();
  return qs.filter((q) => {
    const key = thinGroupKey(q);
    if (!key) return false; // 판별 불가 — 삭제
    const pos = counts.get(key) ?? 0;
    counts.set(key, pos + 1);
    return pos % 2 === 0;
  });
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
