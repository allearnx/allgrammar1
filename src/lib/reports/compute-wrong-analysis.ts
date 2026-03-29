import type { SupabaseClient } from '@supabase/supabase-js';

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기', passage: '교과서 암기', grammar: '문법', problem: '문제풀이', lastReview: '직전보강',
};

export async function computeWrongAnalysis(
  qc: SupabaseClient,
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
