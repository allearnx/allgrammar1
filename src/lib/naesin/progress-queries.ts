// Stage completion columns — 단일 소스 (새 스테이지 추가 시 여기만 수정)
export const STAGE_COMPLETION_COLS = [
  'vocab_completed',
  'passage_completed',
  'dialogue_completed',
  'grammar_completed',
  'problem_completed',
  'mock_exam_completed',
] as const;

export const ROUND2_STAGE_COLS = [
  'round2_passage_completed',
  'round2_dialogue_completed',
] as const;

export type StageField = (typeof STAGE_COMPLETION_COLS)[number];

/** 완료 스테이지 개수 카운트 */
export function countCompletedStages(
  row: Record<string, unknown>,
  includeRound2 = false,
): number {
  let count = 0;
  for (const col of STAGE_COMPLETION_COLS) {
    if (row[col]) count++;
  }
  if (includeRound2) {
    for (const col of ROUND2_STAGE_COLS) {
      if (row[col]) count++;
    }
  }
  return count;
}

/** 단원당 총 스테이지 수 */
export function totalStagesPerUnit(includeRound2 = false): number {
  return STAGE_COMPLETION_COLS.length + (includeRound2 ? ROUND2_STAGE_COLS.length : 0);
}
