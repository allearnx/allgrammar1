import { format } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function computeTrends(
  qc: SupabaseClient,
  vocaQuizHistory: { score: number; created_at: string; day_id: string }[],
  naesinProblemHistory: { score: number; total_questions: number; created_at: string; unit_id: string }[],
  naesinVocabHistory: { score: number; created_at: string }[],
) {
  // Voca day labels
  const vocaDayIds = [...new Set(vocaQuizHistory.map((r) => r.day_id))];
  const vocaDayMap: Record<string, string> = {};
  if (vocaDayIds.length > 0) {
    const { data } = await qc.from('voca_days').select('id, title').in('id', vocaDayIds);
    if (data) for (const d of data) vocaDayMap[d.id] = d.title;
  }

  // Naesin unit labels
  const naesinUnitIds = [...new Set(naesinProblemHistory.map((r) => r.unit_id))];
  const naesinUnitMap: Record<string, string> = {};
  if (naesinUnitIds.length > 0) {
    const { data } = await qc.from('naesin_units').select('id, title').in('id', naesinUnitIds);
    if (data) for (const u of data) naesinUnitMap[u.id] = u.title;
  }

  return {
    vocaQuizScores: vocaQuizHistory.reverse().map((r) => ({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      score: r.score,
      label: vocaDayMap[r.day_id] || 'Day',
    })),
    naesinProblemScores: naesinProblemHistory.reverse().map((r) => ({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      score: r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0,
      label: naesinUnitMap[r.unit_id] || 'Unit',
    })),
    naesinVocabScores: naesinVocabHistory.reverse().map((r) => ({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      score: r.score,
    })),
  };
}
