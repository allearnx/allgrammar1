import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';

const PASS_THRESHOLD = 80;

const dialogueProgressSchema = z.object({
  unitId: z.string().max(100),
  score: z.number(),
  round: z.enum(['1', '2']).default('1'),
});

export const POST = createApiHandler(
  { schema: dialogueProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, score, round } = body;
    const isRound2 = round === '2';

    const colBest = isRound2 ? 'round2_dialogue_translation_best' : 'dialogue_translation_best';
    const colCompleted = isRound2 ? 'round2_dialogue_completed' : 'dialogue_completed';

    const { data: existing } = await supabase
      .from('naesin_student_progress')
      .select('dialogue_translation_best, round2_dialogue_translation_best')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single();

    const currentBest = (isRound2
      ? existing?.round2_dialogue_translation_best
      : existing?.dialogue_translation_best) ?? 0;
    const newBest = Math.max(currentBest, score);
    const dialogueCompleted = newBest >= PASS_THRESHOLD;

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert({
        student_id: user.id,
        unit_id: unitId,
        [colBest]: newBest,
        [colCompleted]: dialogueCompleted,
      }, { onConflict: 'student_id,unit_id' }));

    return NextResponse.json({ success: true, dialogueCompleted, round });
  }
);
