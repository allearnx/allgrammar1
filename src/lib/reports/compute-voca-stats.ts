import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReportVocaStats } from '@/types/report';
import { avgNullableScore } from '@/lib/utils/report-analysis';

/**
 * 학생이 학습 중인(진도 행이 있는) 교재들의 전체 Day 수.
 * "진행률 N/M Day"의 분모 — voca_days 전체 카운트(모든 교재 합, 475 같은 숫자)를
 * 쓰면 학생과 무관한 분모가 되므로, 진도 행의 day_id → 교재 → 그 교재들의 Day 수로 좁힌다.
 */
export async function countStudentBookDays(qc: SupabaseClient, dayIds: string[]): Promise<number> {
  if (dayIds.length === 0) return 0;
  const { data: days } = await qc.from('voca_days').select('book_id').in('id', dayIds);
  const bookIds = [...new Set((days ?? []).map((d) => d.book_id))];
  if (bookIds.length === 0) return 0;
  const { count } = await qc
    .from('voca_days')
    .select('id', { count: 'exact', head: true })
    .in('book_id', bookIds);
  return count || 0;
}

export async function computeVocaStats(
  qc: SupabaseClient,
  vocaProgressData: { day_id: string; flashcard_completed: boolean; quiz_score: number | null; spelling_score: number | null; matching_completed: boolean }[],
): Promise<ReportVocaStats> {
  const totalDaysCount = await countStudentBookDays(qc, vocaProgressData.map((p) => p.day_id));
  return {
    daysInProgress: vocaProgressData.length,
    totalDays: totalDaysCount,
    flashcardCompleted: vocaProgressData.filter((p) => p.flashcard_completed).length,
    quizAvgScore: avgNullableScore(vocaProgressData.map((p) => p.quiz_score)),
    spellingAvgScore: avgNullableScore(vocaProgressData.map((p) => p.spelling_score)),
    matchingCompleted: vocaProgressData.filter((p) => p.matching_completed).length,
  };
}
