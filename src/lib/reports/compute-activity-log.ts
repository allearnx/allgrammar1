import { format } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityRecord } from '@/types/student-report';

export async function computeActivityLog(
  qc: SupabaseClient,
  vocaQuizActivity: { score: number; created_at: string; day_id: string }[],
  vocaMatchingActivity: { score: number; created_at: string; day_id: string }[],
  naesinVocabActivity: { score: number; created_at: string; unit_id: string }[],
  naesinProblemActivity: { score: number; total_questions: number; created_at: string; unit_id: string }[],
  naesinPassageActivity: { created_at: string; unit_id: string }[],
  naesinVideoActivity: { created_at: string; unit_id: string }[],
): Promise<ActivityRecord[]> {
  // Fetch labels
  const vocaDayIds = [...new Set([...vocaQuizActivity.map((r) => r.day_id), ...vocaMatchingActivity.map((r) => r.day_id)])];
  const dayMap: Record<string, string> = {};
  if (vocaDayIds.length > 0) {
    const { data } = await qc.from('voca_days').select('id, title').in('id', vocaDayIds);
    if (data) for (const d of data) dayMap[d.id] = d.title;
  }

  const naesinUnitIds = [...new Set([
    ...naesinVocabActivity.map((r) => r.unit_id),
    ...naesinProblemActivity.map((r) => r.unit_id),
    ...naesinPassageActivity.map((r) => r.unit_id),
    ...naesinVideoActivity.map((r) => r.unit_id),
  ])];
  const unitMap: Record<string, string> = {};
  if (naesinUnitIds.length > 0) {
    const { data } = await qc.from('naesin_units').select('id, title').in('id', naesinUnitIds);
    if (data) for (const u of data) unitMap[u.id] = u.title;
  }

  const log: ActivityRecord[] = [];

  for (const r of vocaQuizActivity) {
    log.push({ date: format(new Date(r.created_at), 'yyyy-MM-dd'), type: 'voca_quiz', label: `보카 ${dayMap[r.day_id] || 'Day'} 퀴즈`, score: r.score, maxScore: 100 });
  }
  for (const r of vocaMatchingActivity) {
    log.push({ date: format(new Date(r.created_at), 'yyyy-MM-dd'), type: 'voca_matching', label: `보카 ${dayMap[r.day_id] || 'Day'} 매칭`, score: r.score, maxScore: 100 });
  }
  for (const r of naesinVocabActivity) {
    log.push({ date: format(new Date(r.created_at), 'yyyy-MM-dd'), type: 'naesin_vocab', label: `내신 ${unitMap[r.unit_id] || 'Unit'} 단어 퀴즈`, score: r.score, maxScore: 100 });
  }
  for (const r of naesinProblemActivity) {
    log.push({ date: format(new Date(r.created_at), 'yyyy-MM-dd'), type: 'naesin_problem', label: `내신 ${unitMap[r.unit_id] || 'Unit'} 문제풀이`, score: r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : null, maxScore: 100 });
  }
  for (const r of naesinPassageActivity) {
    log.push({ date: format(new Date(r.created_at), 'yyyy-MM-dd'), type: 'naesin_passage', label: `내신 ${unitMap[r.unit_id] || 'Unit'} 지문 학습`, score: null, maxScore: null });
  }
  for (const r of naesinVideoActivity) {
    log.push({ date: format(new Date(r.created_at), 'yyyy-MM-dd'), type: 'naesin_video', label: `내신 ${unitMap[r.unit_id] || 'Unit'} 문법영상`, score: null, maxScore: null });
  }

  log.sort((a, b) => b.date.localeCompare(a.date));
  return log;
}
