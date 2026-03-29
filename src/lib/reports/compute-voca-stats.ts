import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReportVocaStats } from '@/types/report';
import { avgNullableScore } from '@/lib/utils/report-analysis';

export async function computeVocaStats(
  qc: SupabaseClient,
  vocaProgressData: { flashcard_completed: boolean; quiz_score: number | null; spelling_score: number | null; matching_completed: boolean }[],
): Promise<ReportVocaStats> {
  const { count: totalDaysCount } = await qc.from('voca_days').select('id', { count: 'exact', head: true });
  return {
    daysInProgress: vocaProgressData.length,
    totalDays: totalDaysCount || 0,
    flashcardCompleted: vocaProgressData.filter((p) => p.flashcard_completed).length,
    quizAvgScore: avgNullableScore(vocaProgressData.map((p) => p.quiz_score)),
    spellingAvgScore: avgNullableScore(vocaProgressData.map((p) => p.spelling_score)),
    matchingCompleted: vocaProgressData.filter((p) => p.matching_completed).length,
  };
}
