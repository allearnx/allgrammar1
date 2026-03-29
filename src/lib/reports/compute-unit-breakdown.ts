import type { SupabaseClient } from '@supabase/supabase-js';
import type { StudentReportData } from '@/types/student-report';

export async function computeUnitBreakdown(
  qc: SupabaseClient,
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
