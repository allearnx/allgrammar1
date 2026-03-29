import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';

const PASS_THRESHOLD = 80;

const dialogueProgressSchema = z.object({
  unitId: z.string().max(100),
  score: z.number(),
});

export const POST = createApiHandler(
  { schema: dialogueProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, score } = body;

    const { data: existing } = await supabase
      .from('naesin_student_progress')
      .select('dialogue_translation_best')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single();

    const currentBest = existing?.dialogue_translation_best ?? 0;
    const newBest = Math.max(currentBest, score);
    const dialogueCompleted = newBest >= PASS_THRESHOLD;

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert({
        student_id: user.id,
        unit_id: unitId,
        dialogue_translation_best: newBest,
        dialogue_completed: dialogueCompleted,
      }, { onConflict: 'student_id,unit_id' }));

    return NextResponse.json({ success: true, dialogueCompleted });
  }
);
