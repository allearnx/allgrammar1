import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';

const PASS_THRESHOLD = 80;

const dialogueProgressSchema = z.object({
  unitId: z.string().max(100),
  score: z.number(),
  round: z.enum(['1', '2']).default('1'),
  type: z.enum(['ordering', 'first_letter', 'translation']).default('translation'),
});

const COL_MAP = {
  ordering: { r1: 'dialogue_ordering_best', r2: 'round2_dialogue_ordering_best' },
  first_letter: { r1: 'dialogue_first_letter_best', r2: 'round2_dialogue_first_letter_best' },
  translation: { r1: 'dialogue_translation_best', r2: 'round2_dialogue_translation_best' },
} as const;

export const POST = createApiHandler(
  { schema: dialogueProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, score, round, type } = body;
    const isRound2 = round === '2';

    const colBest = isRound2 ? COL_MAP[type].r2 : COL_MAP[type].r1;
    const colCompleted = isRound2 ? 'round2_dialogue_completed' : 'dialogue_completed';

    // Fetch existing scores for both translation best (for completion check) and current type best
    const selectCols = 'dialogue_translation_best, round2_dialogue_translation_best, dialogue_ordering_best, dialogue_first_letter_best, round2_dialogue_ordering_best, round2_dialogue_first_letter_best';

    const { data: existing } = await supabase
      .from('naesin_student_progress')
      .select(selectCols)
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single();

    const currentBest = (existing?.[colBest] as number | null) ?? 0;
    const newBest = Math.max(currentBest, score);

    // Completion is based on translation score only (ordering/first_letter are warmup)
    const translationBestCol = isRound2 ? 'round2_dialogue_translation_best' : 'dialogue_translation_best';
    const translationBest = type === 'translation'
      ? Math.max((existing?.[translationBestCol] as number | null) ?? 0, score)
      : (existing?.[translationBestCol] as number | null) ?? 0;
    const dialogueCompleted = translationBest >= PASS_THRESHOLD;

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert({
        student_id: user.id,
        unit_id: unitId,
        [colBest]: newBest,
        [colCompleted]: dialogueCompleted,
      }, { onConflict: 'student_id,unit_id' }));

    return NextResponse.json({ success: true, dialogueCompleted, round, type });
  }
);
