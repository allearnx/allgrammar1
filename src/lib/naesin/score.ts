/**
 * 시트 점수 계산 — 모든 문항에 배점(points)이 있으면 "맞은 문항 배점 합 ÷ 총 배점",
 * 아니면 "맞은 문항 수 ÷ 전체 문항 수". submit 라우트와 재채점이 같은 규칙을 쓴다.
 */
export function hasPointWeights(questions: { points?: number }[] | null | undefined, totalQuestions: number): boolean {
  return !!questions && questions.length === totalQuestions && totalQuestions > 0
    && questions.every((q) => typeof q.points === 'number' && Number.isFinite(q.points) && q.points > 0);
}

export function computeSheetScore(
  questions: { points?: number }[] | null | undefined,
  totalQuestions: number,
  wrongNumbers: Iterable<number>,
): number {
  if (totalQuestions <= 0) return 0;
  const wrong = new Set(wrongNumbers);
  if (hasPointWeights(questions, totalQuestions)) {
    let earned = 0; let total = 0;
    questions!.forEach((q, i) => { total += q.points!; if (!wrong.has(i + 1)) earned += q.points!; });
    return Math.round((earned / total) * 100);
  }
  return Math.round(((totalQuestions - wrong.size) / totalQuestions) * 100);
}
