import { format, subDays } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReportNaesinStats, ReportVocaStats } from '@/types/report';
import type { StudentReportData, ActivityRecord } from '@/types/student-report';
import { avgScore, avgNullableScore } from '@/lib/utils/report-analysis';

type QC = SupabaseClient;

// ── Parallel queries ──

async function fetchRawData(qc: QC, sid: string, ninetyDaysAgo: string) {
  return Promise.all([
    // Phase 1
    qc.from('student_progress').select('video_completed, video_watched_seconds').eq('student_id', sid),
    qc.from('student_memory_progress').select('is_mastered, quiz_correct_count, quiz_wrong_count').eq('student_id', sid),

    // Naesin
    qc.from('naesin_student_progress').select('unit_id, vocab_completed, vocab_quiz_score, passage_completed, grammar_completed, problem_completed, last_review_unlocked').eq('student_id', sid),
    qc.from('naesin_problem_attempts').select('score, total_questions, created_at, unit_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),
    qc.from('naesin_wrong_answers').select('id, resolved, stage, unit_id').eq('student_id', sid),
    qc.from('naesin_grammar_video_progress').select('completed, cumulative_watch_seconds, created_at, unit_id').eq('student_id', sid),
    qc.from('naesin_vocab_quiz_set_results').select('score, created_at, unit_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),

    // Voca
    qc.from('voca_student_progress').select('day_id, flashcard_completed, quiz_score, spelling_score, matching_score, matching_completed, round2_flashcard_completed, round2_quiz_score, round2_matching_score, round2_matching_completed').eq('student_id', sid),

    // Trends
    qc.from('voca_quiz_results').select('score, created_at, wrong_words, day_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),

    // Wrong words
    qc.from('voca_quiz_results').select('wrong_words').eq('student_id', sid),
    qc.from('voca_matching_submissions').select('wrong_words').eq('student_id', sid),

    // Activity log (last 90 days)
    qc.from('voca_quiz_results').select('score, created_at, day_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('voca_matching_submissions').select('score, created_at, day_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_vocab_quiz_set_results').select('score, created_at, unit_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_problem_attempts').select('score, total_questions, created_at, unit_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_passage_attempts').select('created_at, unit_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_grammar_video_progress').select('created_at, unit_id').eq('student_id', sid).eq('completed', true).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
  ]);
}

// ── Naesin stats ──

async function computeNaesinStats(
  qc: QC, sid: string,
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

// ── Voca stats ──

async function computeVocaStats(
  qc: QC,
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

// ── Weaknesses & recommendations ──

function computeWeaknesses(
  naesin: ReportNaesinStats | null,
  voca: ReportVocaStats | null,
  quizCorrect: number,
  quizTotal: number,
): { weaknesses: string[]; recommendations: string[] } {
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
  if (quizTotal > 0 && Math.round((quizCorrect / quizTotal) * 100) < 70) {
    weaknesses.push(`문법 퀴즈 정답률 ${Math.round((quizCorrect / quizTotal) * 100)}%`);
  }

  return { weaknesses, recommendations };
}

// ── Trends ──

async function computeTrends(
  qc: QC,
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

// ── Wrong analysis ──

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기', passage: '교과서 암기', grammar: '문법', problem: '문제풀이', lastReview: '직전보강',
};

async function computeWrongAnalysis(
  qc: QC,
  vocaQuizWrong: { wrong_words: unknown }[],
  vocaMatchingWrong: { wrong_words: unknown }[],
  naesinWrongData: { resolved: boolean; stage: string; unit_id: string }[],
) {
  // Voca top wrong words
  const wrongWordCounts: Record<string, number> = {};
  for (const row of vocaQuizWrong) {
    for (const w of (row.wrong_words as { front_text: string }[]) || []) {
      wrongWordCounts[w.front_text] = (wrongWordCounts[w.front_text] || 0) + 1;
    }
  }
  for (const row of vocaMatchingWrong) {
    for (const w of (row.wrong_words as { word: string }[]) || []) {
      wrongWordCounts[w.word] = (wrongWordCounts[w.word] || 0) + 1;
    }
  }
  const vocaTopWrong = Object.entries(wrongWordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // Naesin wrong by stage & unit
  const stageGroups: Record<string, { total: number; unresolved: number }> = {};
  const unitGroups: Record<string, { total: number; unresolved: number }> = {};

  for (const w of naesinWrongData) {
    const stage = w.stage || 'unknown';
    if (!stageGroups[stage]) stageGroups[stage] = { total: 0, unresolved: 0 };
    stageGroups[stage].total++;
    if (!w.resolved) stageGroups[stage].unresolved++;

    if (w.unit_id) {
      if (!unitGroups[w.unit_id]) unitGroups[w.unit_id] = { total: 0, unresolved: 0 };
      unitGroups[w.unit_id].total++;
      if (!w.resolved) unitGroups[w.unit_id].unresolved++;
    }
  }

  const naesinWrongByStage = Object.entries(stageGroups).map(([stage, data]) => ({
    stage: STAGE_LABELS[stage] || stage,
    ...data,
  }));

  const wrongUnitIds = Object.keys(unitGroups);
  const wrongUnitMap: Record<string, string> = {};
  if (wrongUnitIds.length > 0) {
    const { data } = await qc.from('naesin_units').select('id, title').in('id', wrongUnitIds);
    if (data) for (const u of data) wrongUnitMap[u.id] = u.title;
  }

  const naesinWrongByUnit = Object.entries(unitGroups).map(([unitId, data]) => ({
    unitId,
    unitTitle: wrongUnitMap[unitId] || unitId,
    ...data,
  }));

  return { vocaTopWrong, naesinWrongByStage, naesinWrongByUnit };
}

// ── Unit breakdown ──

async function computeUnitBreakdown(
  qc: QC,
  hasVoca: boolean,
  hasNaesin: boolean,
  vocaProgressData: { day_id: string; flashcard_completed: boolean; quiz_score: number | null; spelling_score: number | null; matching_score: number | null; matching_completed: boolean; round2_flashcard_completed: boolean; round2_quiz_score: number | null; round2_matching_completed: boolean }[],
  naesinProgressData: { unit_id: string; vocab_completed: boolean; vocab_quiz_score: number | null; passage_completed: boolean; grammar_completed: boolean; problem_completed: boolean }[],
  naesinProblemHistory: { score: number; total_questions: number; unit_id: string }[],
) {
  const vocaDays: StudentReportData['unitBreakdown']['vocaDays'] = [];
  if (hasVoca && vocaProgressData.length > 0) {
    const dayIds = [...new Set(vocaProgressData.map((p) => p.day_id))];
    const dayInfoMap: Record<string, { day_number: number; title: string }> = {};
    if (dayIds.length > 0) {
      const { data } = await qc.from('voca_days').select('id, day_number, title').in('id', dayIds);
      if (data) for (const d of data) dayInfoMap[d.id] = { day_number: d.day_number, title: d.title };
    }

    for (const p of vocaProgressData) {
      const dayInfo = dayInfoMap[p.day_id];
      const quizPass = (p.quiz_score ?? 0) >= 80;
      const fcDone = p.flashcard_completed || quizPass;
      const r1Complete = fcDone && quizPass && (p.spelling_score ?? 0) >= 80 && p.matching_completed;
      const r2QuizPass = (p.round2_quiz_score ?? 0) >= 80;
      const r2FcDone = p.round2_flashcard_completed || r2QuizPass;
      const r2Complete = r2FcDone && r2QuizPass && p.round2_matching_completed;

      vocaDays.push({
        dayNumber: dayInfo?.day_number || 0,
        title: dayInfo?.title || 'Unknown',
        quizScore: p.quiz_score,
        spellingScore: p.spelling_score,
        matchingScore: p.matching_score,
        r1Complete,
        r2Complete,
      });
    }
    vocaDays.sort((a, b) => a.dayNumber - b.dayNumber);
  }

  const naesinUnits: StudentReportData['unitBreakdown']['naesinUnits'] = [];
  if (hasNaesin && naesinProgressData.length > 0) {
    const unitIds = [...new Set(naesinProgressData.map((p) => p.unit_id))];
    const unitInfoMap: Record<string, { unit_number: number; title: string }> = {};
    if (unitIds.length > 0) {
      const { data } = await qc.from('naesin_units').select('id, unit_number, title').in('id', unitIds);
      if (data) for (const u of data) unitInfoMap[u.id] = { unit_number: u.unit_number, title: u.title };
    }

    const problemsByUnit: Record<string, number[]> = {};
    for (const p of naesinProblemHistory) {
      if (!problemsByUnit[p.unit_id]) problemsByUnit[p.unit_id] = [];
      if (p.total_questions > 0) problemsByUnit[p.unit_id].push(Math.round((p.score / p.total_questions) * 100));
    }

    for (const p of naesinProgressData) {
      const unitInfo = unitInfoMap[p.unit_id];
      const stagesCompleted = (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
      const unitScores = problemsByUnit[p.unit_id] || [];
      const problemAvg = unitScores.length > 0 ? Math.round(unitScores.reduce((a, b) => a + b, 0) / unitScores.length) : null;

      naesinUnits.push({
        unitNumber: unitInfo?.unit_number || 0,
        title: unitInfo?.title || 'Unknown',
        vocabScore: p.vocab_quiz_score ?? null,
        passageComplete: p.passage_completed,
        problemScore: problemAvg,
        stagesCompleted,
      });
    }
    naesinUnits.sort((a, b) => a.unitNumber - b.unitNumber);
  }

  return { vocaDays, naesinUnits };
}

// ── Activity log ──

async function computeActivityLog(
  qc: QC,
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

// ── Main export ──

export async function buildStudentReport(
  queryClient: QC,
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
  ] = await fetchRawData(queryClient, studentId, ninetyDaysAgo);

  // Naesin
  const naesin = hasNaesin
    ? await computeNaesinStats(queryClient, studentId, naesinProgressRes.data || [], naesinProblemRes.data || [], naesinWrongRes.data || [], naesinVideoRes.data || [], naesinQuizSetRes.data || [])
    : null;

  // Voca
  const voca = hasVoca
    ? await computeVocaStats(queryClient, vocaProgressRes.data || [])
    : null;

  // Weaknesses
  const memProg = memoryRes.data || [];
  const totalQuizCorrect = memProg.reduce((a, p) => a + p.quiz_correct_count, 0);
  const totalQuizWrong = memProg.reduce((a, p) => a + p.quiz_wrong_count, 0);
  const { weaknesses, recommendations } = computeWeaknesses(naesin, voca, totalQuizCorrect, totalQuizCorrect + totalQuizWrong);

  // Trends
  const trends = await computeTrends(queryClient, vocaQuizHistoryRes.data || [], naesinProblemRes.data || [], naesinQuizSetRes.data || []);

  // Wrong analysis
  const wrongAnalysis = await computeWrongAnalysis(queryClient, vocaQuizWrongRes.data || [], vocaMatchingWrongRes.data || [], (naesinWrongRes.data || []) as { resolved: boolean; stage: string; unit_id: string }[]);

  // Unit breakdown
  const unitBreakdown = await computeUnitBreakdown(queryClient, hasVoca, hasNaesin, vocaProgressRes.data || [], naesinProgressRes.data || [], naesinProblemRes.data || []);

  // Activity log
  const activityLog = await computeActivityLog(queryClient, vocaQuizActivityRes.data || [], vocaMatchingActivityRes.data || [], naesinVocabActivityRes.data || [], naesinProblemActivityRes.data || [], naesinPassageActivityRes.data || [], naesinVideoActivityRes.data || []);

  return {
    current: { services, naesin, voca, weaknesses, recommendations },
    trends,
    wrongAnalysis,
    unitBreakdown,
    activityLog,
  };
}
