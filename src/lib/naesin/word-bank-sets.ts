/**
 * Word bank 세트 유지 유틸 — PDF 패러프레이즈용.
 *
 * 원본 워크북의 보기 상자(word bank) 빈칸 문항은 "각 단어를 한 번씩 사용"하는
 * 세트라 소거법으로 정답이 유일해진다. 패러프레이즈가 문항을 낱개로 변형하면
 * 보기 상자가 문항마다 제각각이 되어 세트가 무너지므로, 변형 후 세트의 정답들로
 * [보기] 상자를 재조립해 전 문항에 동일하게 부착한다 (코드로 소거법 보장).
 */

type Q = Record<string, unknown>;

/** question 첫 줄이 "[보기] a / b / c"면 단어 배열, 아니면 null */
export function bankWords(q: Q): string[] | null {
  const first = String(q?.question ?? '').split('\n', 1)[0].trim();
  if (!first.startsWith('[보기]')) return null;
  const words = first.replace(/^\[보기\]\s*/, '').split('/').map((w) => w.trim()).filter(Boolean);
  return words.length >= 2 ? words : null;
}

/** 두 문항이 같은 word bank(단어 집합 동일)를 공유하는지 */
export function sameBank(a: Q, b: Q): boolean {
  const wa = bankWords(a);
  const wb = bankWords(b);
  if (!wa || !wb || wa.length !== wb.length) return false;
  const sa = new Set(wa.map((w) => w.toLowerCase()));
  return wb.every((w) => sa.has(w.toLowerCase()));
}

/**
 * 원본에서 word bank 세트(같은 보기 상자를 공유하는 연속 문항 run)를 찾아,
 * 변형본의 해당 문항들 정답으로 [보기] 상자를 재조립해 동일하게 부착.
 * 원본·변형본은 인덱스 1:1 대응이어야 하며(개수 불일치 시 건너뜀),
 * 정답이 비었거나 중복이면 해당 세트는 손대지 않는다.
 */
export function rebuildBankSets(orig: Q[], out: Q[]): void {
  if (orig.length !== out.length) return;
  let i = 0;
  while (i < orig.length) {
    if (!bankWords(orig[i])) { i++; continue; }
    let j = i + 1;
    while (j < orig.length && sameBank(orig[i], orig[j])) j++;
    if (j - i >= 2) {
      const answers = out.slice(i, j).map((q) => String(q?.answer ?? '').trim());
      const unique = new Set(answers.map((a) => a.toLowerCase()));
      if (answers.every(Boolean) && unique.size === answers.length) {
        // 알파벳순 정렬 — 문항 순서에서 정답 위치가 유추되지 않게
        const bankLine = `[보기] ${[...answers].sort((a, b) => a.localeCompare(b)).join(' / ')}`;
        for (let k = i; k < j; k++) {
          const q = String(out[k].question ?? '');
          const firstIsBank = q.split('\n', 1)[0].trim().startsWith('[보기]');
          const nl = q.indexOf('\n');
          const rest = firstIsBank ? (nl === -1 ? '' : q.slice(nl + 1)) : q;
          out[k].question = rest ? `${bankLine}\n${rest}` : bankLine;
        }
      }
    }
    i = j;
  }
}
