const CHEER = [
  '대단해! 실력이 느는 게 보여!',
  '멋지다! 이 조자로 계속 가보자!',
  '완벽에 가까워! 자신감을 가져!',
];

const ENCOURAGE = [
  '괜찮아! 틀린 문제만 다시 보면 금방이야!',
  '조금만 더 하면 돼! 포기하지 마!',
  '아깝다! 한 번 더 도전하면 분명 통과할 수 있어!',
];

/**
 * 점수대별 격려 문구. `seed`를 주면(예: 시도 id·시각) 같은 seed엔 항상 같은 문구를 돌려준다 —
 * 서버 렌더 화면(마지막 풀이 결과)에서 무작위 선택이 hydration 불일치를 냈던 문제 방지.
 */
export function getEncouragement(score: number, seed?: string): string {
  const list = score >= 80 ? CHEER : ENCOURAGE;
  if (seed === undefined) return list[Math.floor(Math.random() * list.length)];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}
