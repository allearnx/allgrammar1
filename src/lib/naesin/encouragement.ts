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

export function getEncouragement(score: number): string {
  const list = score >= 80 ? CHEER : ENCOURAGE;
  return list[Math.floor(Math.random() * list.length)];
}
