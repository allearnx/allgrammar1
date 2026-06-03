import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { vocabProgressSchema } from '@/lib/api/schemas';
import { buildVocabProgressUpdates } from '@/lib/progress-helpers';

export const POST = createApiHandler(
  { schema: vocabProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, type, score, totalItems } = body;

    // Get or create progress
    const { data: existing } = await supabase
      .from('naesin_student_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single();

    const { updates, vocabCompleted } = buildVocabProgressUpdates(type, score, totalItems, existing);

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert({ student_id: user.id, unit_id: unitId, ...updates }, { onConflict: 'student_id,unit_id' }));
    return NextResponse.json({ success: true, vocabCompleted });
  }
);
