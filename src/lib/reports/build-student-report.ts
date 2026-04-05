import { format, subDays } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StudentReportData } from '@/types/student-report';
import { fetchRawData } from './fetch-raw-data';
import { computeNaesinStats } from './compute-naesin-stats';
import { computeVocaStats } from './compute-voca-stats';
import { computeWeaknesses } from './compute-weaknesses';
import { computeTrends } from './compute-trends';
import { computeWrongAnalysis } from './compute-wrong-analysis';
import { computeUnitBreakdown } from './compute-unit-breakdown';
import { computeActivityLog } from './compute-activity-log';

export async function buildStudentReport(
  queryClient: SupabaseClient,
  studentId: string,
  services: ('naesin' | 'voca')[],
): Promise<StudentReportData> {
  const hasNaesin = services.includes('naesin');
  const hasVoca = services.includes('voca');
  const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

  const [
    _videoRes, memoryRes,
    naesinProgressRes, naesinProblemRes, naesinWrongRes, naesinVideoRes, naesinQuizSetRes,
    vocaProgressRes,
    vocaQuizHistoryRes,
    vocaQuizWrongRes, vocaMatchingWrongRes,
    vocaQuizActivityRes, vocaMatchingActivityRes, naesinVocabActivityRes,
    naesinProblemActivityRes, naesinPassageActivityRes, naesinVideoActivityRes,
    naesinPassageAllRes,
  ] = await fetchRawData(queryClient, studentId, ninetyDaysAgo);

  const naesin = hasNaesin
    ? await computeNaesinStats(queryClient, studentId, naesinProgressRes.data || [], naesinProblemRes.data || [], naesinWrongRes.data || [], naesinVideoRes.data || [], naesinQuizSetRes.data || [])
    : null;

  const voca = hasVoca
    ? await computeVocaStats(queryClient, vocaProgressRes.data || [])
    : null;

  const memProg = memoryRes.data || [];
  const totalQuizCorrect = memProg.reduce((a, p) => a + p.quiz_correct_count, 0);
  const totalQuizWrong = memProg.reduce((a, p) => a + p.quiz_wrong_count, 0);
  const { weaknesses, recommendations } = computeWeaknesses(naesin, voca, totalQuizCorrect, totalQuizCorrect + totalQuizWrong);

  const trends = await computeTrends(queryClient, vocaQuizHistoryRes.data || [], naesinProblemRes.data || [], naesinQuizSetRes.data || []);

  const wrongAnalysis = await computeWrongAnalysis(queryClient, vocaQuizWrongRes.data || [], vocaMatchingWrongRes.data || [], (naesinWrongRes.data || []) as { resolved: boolean; stage: string; unit_id: string }[]);

  const unitBreakdown = await computeUnitBreakdown(queryClient, hasVoca, hasNaesin, vocaProgressRes.data || [], naesinProgressRes.data || [], naesinProblemRes.data || [], naesinPassageAllRes.data || []);

  const activityLog = await computeActivityLog(queryClient, vocaQuizActivityRes.data || [], vocaMatchingActivityRes.data || [], naesinVocabActivityRes.data || [], naesinProblemActivityRes.data || [], naesinPassageActivityRes.data || [], naesinVideoActivityRes.data || []);

  // Fetch daily learning seconds
  const { data: dailyRows } = await queryClient
    .from('learning_daily_log')
    .select('date, seconds')
    .eq('student_id', studentId)
    .gte('date', ninetyDaysAgo);

  const dailyLearningSeconds: Record<string, number> = {};
  if (dailyRows) {
    for (const row of dailyRows) {
      const d = row.date;
      dailyLearningSeconds[d] = (dailyLearningSeconds[d] || 0) + row.seconds;
    }
  }

  return {
    current: { services, naesin, voca, weaknesses, recommendations },
    trends,
    wrongAnalysis,
    unitBreakdown,
    activityLog,
    dailyLearningSeconds,
  };
}
