import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReportNaesinStats } from '@/types/report';
import { avgScore } from '@/lib/utils/report-analysis';

export async function computeNaesinStats(
  qc: SupabaseClient, sid: string,
  naesinProgressData: { unit_id: string; vocab_completed: boolean; vocab_quiz_score: number | null; passage_completed: boolean; grammar_completed: boolean; problem_completed: boolean; last_review_unlocked: boolean }[],
  naesinProblemData: { score: number; total_questions: number }[],
  naesinWrongData: { resolved: boolean }[],
  naesinVideoData: { completed: boolean; cumulative_watch_seconds: number }[],
  naesinQuizSetData: { score: number }[],
): Promise<ReportNaesinStats> {
  const settingsRes = await qc.from('naesin_student_settings').select('textbook_id').eq('student_id', sid);
  const textbookIds = (settingsRes.data || []).map((s) => s.textbook_id);

  let totalUnitsCount = 0;
  let totalGrammarVideos = 0;

  if (textbookIds.length > 0) {
    const { count } = await qc.from('naesin_units').select('id', { count: 'exact', head: true }).in('textbook_id', textbookIds);
    totalUnitsCount = count || 0;

    const { data: unitIds } = await qc.from('naesin_units').select('id').in('textbook_id', textbookIds);
    if (unitIds && unitIds.length > 0) {
      const { count: vidCount } = await qc.from('naesin_grammar_lessons').select('id', { count: 'exact', head: true }).in('unit_id', unitIds.map((u) => u.id)).eq('content_type', 'video');
      totalGrammarVideos = vidCount || 0;
    }
  }

  const problemScores = naesinProblemData
    .filter((p) => p.total_questions > 0)
    .map((p) => ({ score: Math.round((p.score / p.total_questions) * 100) }));

  return {
    unitsInProgress: naesinProgressData.length,
    totalUnits: totalUnitsCount,
    stagesCompleted: {
      vocab: naesinProgressData.filter((p) => p.vocab_completed).length,
      passage: naesinProgressData.filter((p) => p.passage_completed).length,
      grammar: naesinProgressData.filter((p) => p.grammar_completed).length,
      problem: naesinProgressData.filter((p) => p.problem_completed).length,
      lastReview: naesinProgressData.filter((p) => p.last_review_unlocked).length,
    },
    problemAvgScore: avgScore(problemScores),
    problemAttempts: naesinProblemData.length,
    unresolvedWrongAnswers: naesinWrongData.filter((w) => !w.resolved).length,
    videoCompleted: naesinVideoData.filter((v) => v.completed).length,
    videoTotal: totalGrammarVideos,
    totalWatchSeconds: naesinVideoData.reduce((a, v) => a + v.cumulative_watch_seconds, 0),
    quizSetAvgScore: avgScore(naesinQuizSetData),
  };
}
