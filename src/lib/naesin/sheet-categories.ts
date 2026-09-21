/**
 * 문제 시트 카테고리 그룹 — 학생 화면의 어느 단계에 속하는지.
 *
 * 2026-09-22 사장님 결정: 외부지문(external_passage)은 문제풀이 단계에서 교과서 암기 단계로
 * 이동, **문제풀이 완료 필수 조건에서 제외**하고 기록(시도·점수·오답)만 남긴다.
 * 시트 category 값 자체는 그대로 두고(리포트·오답노트 호환) 그룹 분류만 바꾼다.
 */

/** 문제풀이 단계에 나오고 problem_completed 판정에 포함되는 카테고리 */
export const PROBLEM_STAGE_CATEGORIES = ['problem', 'eng_eng_def'] as const;

/** 교과서 암기 단계 하단 "외부지문" 칩으로 나오는 카테고리 (완료 조건 아님) */
export const EXTERNAL_PASSAGE_CATEGORY = 'external_passage' as const;

/** 관리자 화면·정렬(sort_order)에서 한 목록으로 묶이는 그룹 */
export function sheetListGroup(category: string): string[] {
  if ((PROBLEM_STAGE_CATEGORIES as readonly string[]).includes(category)) return [...PROBLEM_STAGE_CATEGORIES];
  return [category];
}
