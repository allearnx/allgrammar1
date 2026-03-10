import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError } from '@/lib/api';
import { reportGenerateSchema } from '@/lib/api/schemas';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import type { EnhancedReportData, ReportNaesinStats, ReportVocaStats } from '@/types/report';

// ── 약점 / 추천 자동 분석 ──

function computeWeaknesses(report: EnhancedReportData): string[] {
  const w: string[] = [];

  // Phase 1
  if (report.quizAccuracy > 0 && report.quizAccuracy < 70) {
    w.push(`문법 퀴즈 정답률 ${report.quizAccuracy}% (목표 70%)`);
  }
  if (report.memoryProgress.dueReviews > 20) {
    w.push(`복습 대기 ${report.memoryProgress.dueReviews}개 (20개 초과)`);
  }

  // 내신
  if (report.naesin) {
    const n = report.naesin;
    if (n.totalUnits > 0) {
      const completionRate = Math.round((n.unitsInProgress / n.totalUnits) * 100);
      if (completionRate < 50) {
        w.push(`내신 단원 진행률 ${completionRate}% (목표 50%)`);
      }
    }
    if (n.unresolvedWrongAnswers > 5) {
      w.push(`미해결 오답 ${n.unresolvedWrongAnswers}개 (5개 초과)`);
    }
    if (n.problemAvgScore !== null && n.problemAvgScore < 70) {
      w.push(`문제풀이 평균 ${n.problemAvgScore}점 (목표 70점)`);
    }
  }

  // 올톡보카
  if (report.voca) {
    const v = report.voca;
    if (v.quizAvgScore !== null && v.quizAvgScore < 60) {
      w.push(`올톡보카 퀴즈 평균 ${v.quizAvgScore}점 (목표 60점)`);
    }
    if (v.spellingAvgScore !== null && v.spellingAvgScore < 60) {
      w.push(`올톡보카 스펠링 평균 ${v.spellingAvgScore}점 (목표 60점)`);
    }
  }

  return w;
}

function computeRecommendations(report: EnhancedReportData): string[] {
  const r: string[] = [];

  if (report.memoryProgress.dueReviews > 0) {
    r.push('복습 대기 항목을 우선 학습하세요');
  }
  if (report.videoProgress.total > 0 && report.videoProgress.completed < report.videoProgress.total) {
    r.push('미완료 문법 영상을 시청하세요');
  }
  if (report.naesin) {
    if (report.naesin.unresolvedWrongAnswers > 0) {
      r.push('내신 오답을 복습하고 유사 문제를 풀어보세요');
    }
    if (report.naesin.videoTotal > 0 && report.naesin.videoCompleted < report.naesin.videoTotal) {
      r.push('내신 문법 영상을 마저 시청하세요');
    }
  }
  if (report.voca) {
    if (report.voca.totalDays > 0 && report.voca.daysInProgress < report.voca.totalDays) {
      r.push('올톡보카 미완료 Day를 학습하세요');
    }
    if (report.voca.spellingAvgScore !== null && report.voca.spellingAvgScore < 80) {
      r.push('올톡보카 스펠링 연습을 더 하세요');
    }
  }

  return r;
}

// ── 평균 점수 헬퍼 ──

function avgScore(rows: { score: number }[]): number | null {
  if (rows.length === 0) return null;
  return Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length);
}

function avgNullableScore(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, v) => a + v, 0) / valid.length);
}

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: reportGenerateSchema },
  async ({ body, supabase, user }) => {
    const { studentId, reportType } = body;

    // Get student info
    const { data: student } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', studentId)
      .single();

    if (!student) throw new NotFoundError('학생을 찾을 수 없습니다.');

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
      // Phase 1
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

      // Phase 2 — 서비스 배정
      supabase
        .from('service_assignments')
        .select('service')
        .eq('student_id', studentId),

      // Phase 2 — 내신
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

      // Phase 2 — 올톡보카
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

      // 전체 단원 수 (설정된 교과서 기준)
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

      // 전체 문법 영상 수 (설정된 교과서 단원 기준)
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

    // ── 올톡보카 집계 ──
    let voca: ReportVocaStats | null = null;
    if (hasVoca) {
      const vProg = vocaProgressRes.data || [];

      // 전체 Day 수
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
      student: `${student.full_name} (${student.email})`,
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

    // ── weekly_reports에 저장 (upsert) ──
    const now = new Date();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    await supabase.from('weekly_reports').upsert(
      {
        student_id: studentId,
        generated_by: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        stats: report as unknown as Record<string, unknown>,
        weaknesses: report.weaknesses,
        recommendations: report.recommendations,
      },
      { onConflict: 'student_id,week_start' }
    );

    return NextResponse.json(report);
  }
);
