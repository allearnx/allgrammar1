import { format } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EnhancedReportData, ReportNaesinStats, ReportVocaStats } from '@/types/report';
import { computeWeaknesses, computeRecommendations, avgScore, avgNullableScore } from '@/lib/utils/report-analysis';

interface AggregateParams {
  supabase: SupabaseClient;
  studentId: string;
  reportType: 'all' | 'naesin' | 'voca';
  studentName: string;
  studentEmail: string;
}

export async function aggregateWeeklyReport({
  supabase,
  studentId,
  reportType,
  studentName,
  studentEmail,
}: AggregateParams): Promise<EnhancedReportData> {
  const today = format(new Date(), 'yyyy-MM-dd');

  // ── 병렬 쿼리 (Phase 1 + Phase 2) ──
  const [
    videoRes,
    memoryRes,
    dueRes,
    textbookRes,
    grammarCountRes,
    serviceRes,
    naesinProgressRes,
    naesinProblemRes,
    naesinWrongRes,
    naesinVideoRes,
    naesinQuizSetRes,
    vocaProgressRes,
  ] = await Promise.all([
    supabase
      .from('student_progress')
      .select('video_completed, video_watched_seconds')
      .eq('student_id', studentId),
    supabase
      .from('student_memory_progress')
      .select('is_mastered, quiz_correct_count, quiz_wrong_count')
      .eq('student_id', studentId),
    supabase
      .from('student_memory_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('is_mastered', false)
      .lte('next_review_date', today),
    supabase
      .from('student_textbook_progress')
      .select('id')
      .eq('student_id', studentId),
    supabase
      .from('grammars')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('service_assignments')
      .select('service')
      .eq('student_id', studentId),
    supabase
      .from('naesin_student_progress')
      .select('unit_id, vocab_completed, passage_completed, grammar_completed, problem_completed, last_review_unlocked')
      .eq('student_id', studentId),
    supabase
      .from('naesin_problem_attempts')
      .select('score, total_questions')
      .eq('student_id', studentId),
    supabase
      .from('naesin_wrong_answers')
      .select('id, resolved')
      .eq('student_id', studentId),
    supabase
      .from('naesin_grammar_video_progress')
      .select('completed, cumulative_watch_seconds')
      .eq('student_id', studentId),
    supabase
      .from('naesin_vocab_quiz_set_results')
      .select('score')
      .eq('student_id', studentId),
    supabase
      .from('voca_student_progress')
      .select('flashcard_completed, quiz_score, spelling_score, matching_completed')
      .eq('student_id', studentId),
  ]);

  // ── Phase 1 집계 ──
  const videoProg = videoRes.data || [];
  const memProg = memoryRes.data || [];

  const completedVideos = videoProg.filter((p) => p.video_completed).length;
  const totalWatched = videoProg.reduce((a, p) => a + p.video_watched_seconds, 0);
  const totalQuizCorrect = memProg.reduce((a, p) => a + p.quiz_correct_count, 0);
  const totalQuizWrong = memProg.reduce((a, p) => a + p.quiz_wrong_count, 0);
  const quizTotal = totalQuizCorrect + totalQuizWrong;

  // ── 서비스 배정 확인 ──
  const services = (serviceRes.data || []).map((s) => s.service as 'naesin' | 'voca');
  const hasNaesin = services.includes('naesin') && reportType !== 'voca';
  const hasVoca = services.includes('voca') && reportType !== 'naesin';

  // ── 내신 대비 집계 ──
  let naesin: ReportNaesinStats | null = null;
  if (hasNaesin) {
    const nProg = naesinProgressRes.data || [];
    const nProblems = naesinProblemRes.data || [];
    const nWrong = naesinWrongRes.data || [];
    const nVideos = naesinVideoRes.data || [];
    const nQuizSets = naesinQuizSetRes.data || [];

    const settingsRes = await supabase
      .from('naesin_student_settings')
      .select('textbook_id')
      .eq('student_id', studentId);
    const textbookIds = (settingsRes.data || []).map((s) => s.textbook_id);

    let totalUnitsCount = 0;
    if (textbookIds.length > 0) {
      const { count } = await supabase
        .from('naesin_units')
        .select('id', { count: 'exact', head: true })
        .in('textbook_id', textbookIds);
      totalUnitsCount = count || 0;
    }

    let totalGrammarVideos = 0;
    if (textbookIds.length > 0) {
      const { data: unitIds } = await supabase
        .from('naesin_units')
        .select('id')
        .in('textbook_id', textbookIds);
      if (unitIds && unitIds.length > 0) {
        const { count } = await supabase
          .from('naesin_grammar_lessons')
          .select('id', { count: 'exact', head: true })
          .in('unit_id', unitIds.map((u) => u.id))
          .eq('content_type', 'video');
        totalGrammarVideos = count || 0;
      }
    }

    const problemScores = nProblems
      .filter((p) => p.total_questions > 0)
      .map((p) => ({ score: Math.round((p.score / p.total_questions) * 100) }));

    naesin = {
      unitsInProgress: nProg.length,
      totalUnits: totalUnitsCount,
      stagesCompleted: {
        vocab: nProg.filter((p) => p.vocab_completed).length,
        passage: nProg.filter((p) => p.passage_completed).length,
        grammar: nProg.filter((p) => p.grammar_completed).length,
        problem: nProg.filter((p) => p.problem_completed).length,
        lastReview: nProg.filter((p) => p.last_review_unlocked).length,
      },
      problemAvgScore: avgScore(problemScores),
      problemAttempts: nProblems.length,
      unresolvedWrongAnswers: nWrong.filter((w) => !w.resolved).length,
      videoCompleted: nVideos.filter((v) => v.completed).length,
      videoTotal: totalGrammarVideos,
      totalWatchSeconds: nVideos.reduce((a, v) => a + v.cumulative_watch_seconds, 0),
      quizSetAvgScore: avgScore(nQuizSets),
    };
  }

  // ── 올킬보카 집계 ──
  let voca: ReportVocaStats | null = null;
  if (hasVoca) {
    const vProg = vocaProgressRes.data || [];

    const { count: totalDaysCount } = await supabase
      .from('voca_days')
      .select('id', { count: 'exact', head: true });

    voca = {
      daysInProgress: vProg.length,
      totalDays: totalDaysCount || 0,
      flashcardCompleted: vProg.filter((p) => p.flashcard_completed).length,
      quizAvgScore: avgNullableScore(vProg.map((p) => p.quiz_score)),
      spellingAvgScore: avgNullableScore(vProg.map((p) => p.spelling_score)),
      matchingCompleted: vProg.filter((p) => p.matching_completed).length,
    };
  }

  // ── 리포트 조립 ──
  const report: EnhancedReportData = {
    reportType,
    student: `${studentName} (${studentEmail})`,
    generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
    videoProgress: {
      completed: completedVideos,
      total: grammarCountRes.count || 0,
    },
    memoryProgress: {
      mastered: memProg.filter((p) => p.is_mastered).length,
      total: memProg.length,
      dueReviews: dueRes.data?.length || 0,
    },
    textbookProgress: {
      completed: textbookRes.data?.length || 0,
    },
    totalWatchedMinutes: Math.round(totalWatched / 60),
    quizAccuracy: quizTotal > 0 ? Math.round((totalQuizCorrect / quizTotal) * 100) : 0,
    services,
    naesin,
    voca,
    weaknesses: [],
    recommendations: [],
  };

  report.weaknesses = computeWeaknesses(report);
  report.recommendations = computeRecommendations(report);

  return report;
}
