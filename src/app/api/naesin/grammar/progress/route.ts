import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { grammarProgressSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: grammarProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, type } = body;

    const { data: existing } = await supabase
      .from('naesin_student_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single();

    const updates: Record<string, unknown> = {
      student_id: user.id,
      unit_id: unitId,
    };

    if (type === 'video') {
      updates.grammar_video_completed = true;
    } else if (type === 'text') {
      updates.grammar_text_read = true;
    }

    const videoCompleted = type === 'video' ? true : (existing?.grammar_video_completed ?? false);
    const textRead = type === 'text' ? true : (existing?.grammar_text_read ?? false);
    updates.grammar_completed = videoCompleted || textRead;

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert(updates, { onConflict: 'student_id,unit_id' }));
    return NextResponse.json({ success: true, grammarCompleted: updates.grammar_completed });
  }
);
