import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { format, subDays } from 'date-fns';
import type { ReportNaesinStats, ReportVocaStats } from '@/types/report';
import type { StudentReportData, ActivityRecord } from '@/types/student-report';
import { avgScore, avgNullableScore } from '@/lib/utils/report-analysis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  let targetStudentId: string;
  let services: ('naesin' | 'voca')[] = [];

  if (token) {
    // Token-based access (parent share)
    const admin = createAdminClient();
    const { data: tokenRow } = await admin
      .from('parent_share_tokens')
      .select('student_id')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (!tokenRow) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 404 });
    }
    targetStudentId = tokenRow.student_id;

    const { data: svcData } = await admin
      .from('service_assignments')
      .select('service')
      .eq('student_id', targetStudentId);
    services = (svcData || []).map((s) => s.service as 'naesin' | 'voca');
  } else {
    // Authenticated access
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const studentIdParam = searchParams.get('studentId');

    if (user.role === 'student') {
      targetStudentId = user.id;
    } else if (['teacher', 'admin', 'boss'].includes(user.role)) {
      if (!studentIdParam) {
        return NextResponse.json({ error: 'studentId가 필요합니다.' }, { status: 400 });
      }
      targetStudentId = studentIdParam;
    } else {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: svcData } = await supabase
      .from('service_assignments')
      .select('service')
      .eq('student_id', targetStudentId);
    services = (svcData || []).map((s) => s.service as 'naesin' | 'voca');
  }

  // Use admin client for data queries (works for both token and auth paths)
  const admin = createAdminClient();
  const hasNaesin = services.includes('naesin');
  const hasVoca = services.includes('voca');
  const today = format(new Date(), 'yyyy-MM-dd');
  const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

  // ── Parallel queries ──
  const [
    videoRes,
    memoryRes,
    dueRes,
    grammarCountRes,
    naesinProgressRes,
    naesinProblemRes,
    naesinWrongRes,
    naesinVideoRes,
    naesinQuizSetRes,
    vocaProgressRes,
    vocaQuizHistoryRes,
    naesinProblemHistoryRes,
    naesinVocabHistoryRes,
    vocaQuizWrongRes,
    vocaMatchingWrongRes,
    // Activity log queries
    vocaQuizActivityRes,
    vocaMatchingActivityRes,
    naesinVocabActivityRes,
    naesinProblemActivityRes,
    naesinPassageActivityRes,
    naesinVideoActivityRes,
  ] = await Promise.all([
    // Phase 1
    admin.from('student_progress').select('video_completed, video_watched_seconds').eq('student_id', targetStudentId),
    admin.from('student_memory_progress').select('is_mastered, quiz_correct_count, quiz_wrong_count').eq('student_id', targetStudentId),
    admin.from('student_memory_progress').select('id').eq('student_id', targetStudentId).eq('is_mastered', false).lte('next_review_date', today),
    admin.from('grammars').select('id', { count: 'exact', head: true }),

    // Naesin
    admin.from('naesin_student_progress').select('unit_id, vocab_completed, vocab_quiz_score, passage_completed, grammar_completed, problem_completed, last_review_unlocked').eq('student_id', targetStudentId),
    admin.from('naesin_problem_attempts').select('score, total_questions, created_at').eq('student_id', targetStudentId).order('created_at', { ascending: false }).limit(50),
    admin.from('naesin_wrong_answers').select('id, resolved, stage, unit_id').eq('student_id', targetStudentId),
    admin.from('naesin_grammar_video_progress').select('completed, cumulative_watch_seconds').eq('student_id', targetStudentId),
    admin.from('naesin_vocab_quiz_set_results').select('score, created_at').eq('student_id', targetStudentId).order('created_at', { ascending: false }).limit(50),

    // Voca
    admin.from('voca_student_progress').select('day_id, flashcard_completed, quiz_score, spelling_score, matching_score, matching_completed, round2_flashcard_completed, round2_quiz_score, round2_matching_score, round2_matching_completed').eq('student_id', targetStudentId),

    // Trends
    admin.from('voca_quiz_results').select('score, created_at, wrong_words, day_id').eq('student_id', targetStudentId).order('created_at', { ascending: false }).limit(50),
    admin.from('naesin_problem_attempts').select('score, total_questions, created_at, unit_id').eq('student_id', targetStudentId).order('created_at', { ascending: false }).limit(50),
    admin.from('naesin_vocab_quiz_set_results').select('score, created_at').eq('student_id', targetStudentId).order('created_at', { ascending: false }).limit(50),

    // Wrong words
    admin.from('voca_quiz_results').select('wrong_words').eq('student_id', targetStudentId),
    admin.from('voca_matching_submissions').select('wrong_words').eq('student_id', targetStudentId),

    // Activity log (last 90 days)
    admin.from('voca_quiz_results').select('score, created_at, day_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    admin.from('voca_matching_submissions').select('score, created_at, day_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    admin.from('naesin_vocab_quiz_set_results').select('score, created_at, unit_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    admin.from('naesin_problem_attempts').select('score, total_questions, created_at, unit_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    admin.from('naesin_passage_attempts').select('created_at, unit_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    admin.from('naesin_grammar_video_progress').select('created_at, unit_id').eq('student_id', targetStudentId).eq('completed', true).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
  ]);

  // ── Naesin stats ──
  let naesin: ReportNaesinStats | null = null;
  if (hasNaesin) {
    const nProg = naesinProgressRes.data || [];
    const nProblems = naesinProblemRes.data || [];
    const nWrong = naesinWrongRes.data || [];
    const nVideos = naesinVideoRes.data || [];
    const nQuizSets = naesinQuizSetRes.data || [];

    const settingsRes = await admin.from('naesin_student_settings').select('textbook_id').eq('student_id', targetStudentId);
    const textbookIds = (settingsRes.data || []).map((s) => s.textbook_id);

    let totalUnitsCount = 0;
    if (textbookIds.length > 0) {
      const { count } = await admin.from('naesin_units').select('id', { count: 'exact', head: true }).in('textbook_id', textbookIds);
      totalUnitsCount = count || 0;
    }

    let totalGrammarVideos = 0;
    if (textbookIds.length > 0) {
      const { data: unitIds } = await admin.from('naesin_units').select('id').in('textbook_id', textbookIds);
      if (unitIds && unitIds.length > 0) {
        const { count } = await admin.from('naesin_grammar_lessons').select('id', { count: 'exact', head: true }).in('unit_id', unitIds.map((u) => u.id)).eq('content_type', 'video');
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

  // ── Voca stats ──
  let voca: ReportVocaStats | null = null;
  if (hasVoca) {
    const vProg = vocaProgressRes.data || [];
    const { count: totalDaysCount } = await admin.from('voca_days').select('id', { count: 'exact', head: true });

    voca = {
      daysInProgress: vProg.length,
      totalDays: totalDaysCount || 0,
      flashcardCompleted: vProg.filter((p) => p.flashcard_completed).length,
      quizAvgScore: avgNullableScore(vProg.map((p) => p.quiz_score)),
      spellingAvgScore: avgNullableScore(vProg.map((p) => p.spelling_score)),
      matchingCompleted: vProg.filter((p) => p.matching_completed).length,
    };
  }

  // ── Weaknesses / Recommendations (lightweight) ──
  const videoProg = videoRes.data || [];
  const memProg = memoryRes.data || [];
  const totalQuizCorrect = memProg.reduce((a, p) => a + p.quiz_correct_count, 0);
  const totalQuizWrong = memProg.reduce((a, p) => a + p.quiz_wrong_count, 0);
  const quizTotal = totalQuizCorrect + totalQuizWrong;

  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (naesin) {
    if (naesin.problemAvgScore !== null && naesin.problemAvgScore < 70) weaknesses.push(`문제풀이 평균 ${naesin.problemAvgScore}점 (목표 70점)`);
    if (naesin.unresolvedWrongAnswers > 5) weaknesses.push(`미해결 오답 ${naesin.unresolvedWrongAnswers}개`);
    if (naesin.unresolvedWrongAnswers > 0) recommendations.push('내신 오답을 복습하세요');
  }
  if (voca) {
    if (voca.quizAvgScore !== null && voca.quizAvgScore < 60) weaknesses.push(`올킬보카 퀴즈 평균 ${voca.quizAvgScore}점 (목표 60점)`);
    if (voca.spellingAvgScore !== null && voca.spellingAvgScore < 60) weaknesses.push(`스펠링 평균 ${voca.spellingAvgScore}점 (목표 60점)`);
    if (voca.totalDays > 0 && voca.daysInProgress < voca.totalDays) recommendations.push('올킬보카 미완료 Day를 학습하세요');
  }
  if (quizTotal > 0 && Math.round((totalQuizCorrect / quizTotal) * 100) < 70) {
    weaknesses.push(`문법 퀴즈 정답률 ${Math.round((totalQuizCorrect / quizTotal) * 100)}%`);
  }

  // ── Trends ──
  // Fetch day info for voca labels
  const vocaDayIds = [...new Set((vocaQuizHistoryRes.data || []).map((r) => r.day_id))];
  let vocaDayMap: Record<string, { day_number: number; title: string }> = {};
  if (vocaDayIds.length > 0) {
    const { data: dayData } = await admin.from('voca_days').select('id, day_number, title').in('id', vocaDayIds);
    if (dayData) {
      for (const d of dayData) vocaDayMap[d.id] = { day_number: d.day_number, title: d.title };
    }
  }

  const vocaQuizScores = (vocaQuizHistoryRes.data || []).reverse().map((r) => ({
    date: format(new Date(r.created_at), 'yyyy-MM-dd'),
    score: r.score,
    label: vocaDayMap[r.day_id]?.title || `Day`,
  }));

  // Fetch unit info for naesin labels
  const naesinUnitIds = [...new Set((naesinProblemHistoryRes.data || []).map((r) => r.unit_id))];
  let naesinUnitMap: Record<string, { unit_number: number; title: string }> = {};
  if (naesinUnitIds.length > 0) {
    const { data: unitData } = await admin.from('naesin_units').select('id, unit_number, title').in('id', naesinUnitIds);
    if (unitData) {
      for (const u of unitData) naesinUnitMap[u.id] = { unit_number: u.unit_number, title: u.title };
    }
  }

  const naesinProblemScores = (naesinProblemHistoryRes.data || []).reverse().map((r) => ({
    date: format(new Date(r.created_at), 'yyyy-MM-dd'),
    score: r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0,
    label: naesinUnitMap[r.unit_id]?.title || 'Unit',
  }));

  const naesinVocabScores = (naesinVocabHistoryRes.data || []).reverse().map((r) => ({
    date: format(new Date(r.created_at), 'yyyy-MM-dd'),
    score: r.score,
  }));

  // ── Wrong Analysis ──
  const wrongWordCounts: Record<string, number> = {};
  for (const row of vocaQuizWrongRes.data || []) {
    for (const w of (row.wrong_words as { front_text: string }[]) || []) {
      wrongWordCounts[w.front_text] = (wrongWordCounts[w.front_text] || 0) + 1;
    }
  }
  for (const row of vocaMatchingWrongRes.data || []) {
    for (const w of (row.wrong_words as { word: string }[]) || []) {
      wrongWordCounts[w.word] = (wrongWordCounts[w.word] || 0) + 1;
    }
  }

  const vocaTopWrong = Object.entries(wrongWordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // Naesin wrong by stage
  const nWrongData = naesinWrongRes.data || [];
  const stageGroups: Record<string, { total: number; unresolved: number }> = {};
  const unitGroups: Record<string, { total: number; unresolved: number }> = {};

  for (const w of nWrongData) {
    const stage = (w.stage as string) || 'unknown';
    if (!stageGroups[stage]) stageGroups[stage] = { total: 0, unresolved: 0 };
    stageGroups[stage].total++;
    if (!w.resolved) stageGroups[stage].unresolved++;

    const uid = w.unit_id as string;
    if (uid) {
      if (!unitGroups[uid]) unitGroups[uid] = { total: 0, unresolved: 0 };
      unitGroups[uid].total++;
      if (!w.resolved) unitGroups[uid].unresolved++;
    }
  }

  const STAGE_LABELS: Record<string, string> = {
    vocab: '단어 암기', passage: '교과서 암기', grammar: '문법', problem: '문제풀이', lastReview: '직전보강',
  };

  const naesinWrongByStage = Object.entries(stageGroups).map(([stage, data]) => ({
    stage: STAGE_LABELS[stage] || stage,
    ...data,
  }));

  // Fetch unit titles for wrong by unit
  const wrongUnitIds = Object.keys(unitGroups);
  let wrongUnitMap: Record<string, string> = {};
  if (wrongUnitIds.length > 0) {
    const { data: unitData } = await admin.from('naesin_units').select('id, title').in('id', wrongUnitIds);
    if (unitData) {
      for (const u of unitData) wrongUnitMap[u.id] = u.title;
    }
  }

  const naesinWrongByUnit = Object.entries(unitGroups).map(([unitId, data]) => ({
    unitId,
    unitTitle: wrongUnitMap[unitId] || unitId,
    ...data,
  }));

  // ── Unit Breakdown ──
  // Voca days
  const vocaDaysBreakdown: StudentReportData['unitBreakdown']['vocaDays'] = [];
  if (hasVoca) {
    const vProg = vocaProgressRes.data || [];
    const dayIds = [...new Set(vProg.map((p) => p.day_id))];
    let dayInfoMap: Record<string, { day_number: number; title: string }> = {};
    if (dayIds.length > 0) {
      const { data: dayData } = await admin.from('voca_days').select('id, day_number, title').in('id', dayIds);
      if (dayData) {
        for (const d of dayData) dayInfoMap[d.id] = { day_number: d.day_number, title: d.title };
      }
    }

    for (const p of vProg) {
      const dayInfo = dayInfoMap[p.day_id];
      const quizPass = (p.quiz_score ?? 0) >= 80;
      const fcDone = p.flashcard_completed || quizPass;
      const r1Complete = fcDone && quizPass && (p.spelling_score ?? 0) >= 80 && p.matching_completed;
      const r2QuizPass = (p.round2_quiz_score ?? 0) >= 80;
      const r2FcDone = p.round2_flashcard_completed || r2QuizPass;
      const r2Complete = r2FcDone && r2QuizPass && p.round2_matching_completed;

      vocaDaysBreakdown.push({
        dayNumber: dayInfo?.day_number || 0,
        title: dayInfo?.title || 'Unknown',
        quizScore: p.quiz_score,
        spellingScore: p.spelling_score,
        matchingScore: p.matching_score,
        r1Complete,
        r2Complete,
      });
    }
    vocaDaysBreakdown.sort((a, b) => a.dayNumber - b.dayNumber);
  }

  // Naesin units
  const naesinUnitsBreakdown: StudentReportData['unitBreakdown']['naesinUnits'] = [];
  if (hasNaesin) {
    const nProg = naesinProgressRes.data || [];
    const unitIds = [...new Set(nProg.map((p) => p.unit_id))];
    let unitInfoMap: Record<string, { unit_number: number; title: string }> = {};
    if (unitIds.length > 0) {
      const { data: unitData } = await admin.from('naesin_units').select('id, unit_number, title').in('id', unitIds);
      if (unitData) {
        for (const u of unitData) unitInfoMap[u.id] = { unit_number: u.unit_number, title: u.title };
      }
    }

    // Get problem scores per unit
    const problemsByUnit: Record<string, number[]> = {};
    for (const p of naesinProblemHistoryRes.data || []) {
      if (!problemsByUnit[p.unit_id]) problemsByUnit[p.unit_id] = [];
      if (p.total_questions > 0) {
        problemsByUnit[p.unit_id].push(Math.round((p.score / p.total_questions) * 100));
      }
    }

    for (const p of nProg) {
      const unitInfo = unitInfoMap[p.unit_id];
      const stagesCompleted = (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
      const unitProblemScores = problemsByUnit[p.unit_id] || [];
      const problemAvg = unitProblemScores.length > 0 ? Math.round(unitProblemScores.reduce((a, b) => a + b, 0) / unitProblemScores.length) : null;

      naesinUnitsBreakdown.push({
        unitNumber: unitInfo?.unit_number || 0,
        title: unitInfo?.title || 'Unknown',
        vocabScore: p.vocab_quiz_score ?? null,
        passageComplete: p.passage_completed,
        problemScore: problemAvg,
        stagesCompleted,
      });
    }
    naesinUnitsBreakdown.sort((a, b) => a.unitNumber - b.unitNumber);
  }

  // ── Activity Log ──
  const activityLog: ActivityRecord[] = [];

  // Fetch day info for activity labels
  const activityVocaDayIds = [...new Set([
    ...(vocaQuizActivityRes.data || []).map((r) => r.day_id),
    ...(vocaMatchingActivityRes.data || []).map((r) => r.day_id),
  ])];
  let activityDayMap: Record<string, string> = {};
  if (activityVocaDayIds.length > 0) {
    const { data: dayData } = await admin.from('voca_days').select('id, title').in('id', activityVocaDayIds);
    if (dayData) {
      for (const d of dayData) activityDayMap[d.id] = d.title;
    }
  }

  // Fetch unit info for activity labels
  const activityNaesinUnitIds = [...new Set([
    ...(naesinVocabActivityRes.data || []).map((r) => r.unit_id),
    ...(naesinProblemActivityRes.data || []).map((r) => r.unit_id),
    ...(naesinPassageActivityRes.data || []).map((r) => r.unit_id),
    ...(naesinVideoActivityRes.data || []).map((r) => r.unit_id),
  ])];
  let activityUnitMap: Record<string, string> = {};
  if (activityNaesinUnitIds.length > 0) {
    const { data: unitData } = await admin.from('naesin_units').select('id, title').in('id', activityNaesinUnitIds);
    if (unitData) {
      for (const u of unitData) activityUnitMap[u.id] = u.title;
    }
  }

  for (const r of vocaQuizActivityRes.data || []) {
    activityLog.push({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      type: 'voca_quiz',
      label: `보카 ${activityDayMap[r.day_id] || 'Day'} 퀴즈`,
      score: r.score,
      maxScore: 100,
    });
  }
  for (const r of vocaMatchingActivityRes.data || []) {
    activityLog.push({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      type: 'voca_matching',
      label: `보카 ${activityDayMap[r.day_id] || 'Day'} 매칭`,
      score: r.score,
      maxScore: 100,
    });
  }
  for (const r of naesinVocabActivityRes.data || []) {
    activityLog.push({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      type: 'naesin_vocab',
      label: `내신 ${activityUnitMap[r.unit_id] || 'Unit'} 단어 퀴즈`,
      score: r.score,
      maxScore: 100,
    });
  }
  for (const r of naesinProblemActivityRes.data || []) {
    activityLog.push({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      type: 'naesin_problem',
      label: `내신 ${activityUnitMap[r.unit_id] || 'Unit'} 문제풀이`,
      score: r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : null,
      maxScore: 100,
    });
  }
  for (const r of naesinPassageActivityRes.data || []) {
    activityLog.push({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      type: 'naesin_passage',
      label: `내신 ${activityUnitMap[r.unit_id] || 'Unit'} 지문 학습`,
      score: null,
      maxScore: null,
    });
  }
  for (const r of naesinVideoActivityRes.data || []) {
    activityLog.push({
      date: format(new Date(r.created_at), 'yyyy-MM-dd'),
      type: 'naesin_video',
      label: `내신 ${activityUnitMap[r.unit_id] || 'Unit'} 문법영상`,
      score: null,
      maxScore: null,
    });
  }

  activityLog.sort((a, b) => b.date.localeCompare(a.date));

  // ── Assemble response ──
  const report: StudentReportData = {
    current: {
      services,
      naesin,
      voca,
      weaknesses,
      recommendations,
    },
    trends: {
      vocaQuizScores,
      naesinProblemScores,
      naesinVocabScores,
    },
    wrongAnalysis: {
      vocaTopWrong,
      naesinWrongByStage,
      naesinWrongByUnit,
    },
    unitBreakdown: {
      vocaDays: vocaDaysBreakdown,
      naesinUnits: naesinUnitsBreakdown,
    },
    activityLog,
  };

  return NextResponse.json(report);
}
