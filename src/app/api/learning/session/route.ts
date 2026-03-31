import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { learningSessionHeartbeatSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: learningSessionHeartbeatSchema },
  async ({ user, body, supabase }) => {
    const { contextType, contextId, seconds } = body;

    if (contextType === 'naesin') {
      const { data: existing } = await supabase
        .from('naesin_student_progress')
        .select('total_learning_seconds')
        .eq('student_id', user.id)
        .eq('unit_id', contextId)
        .maybeSingle();

      if (existing) {
        dbResult(await supabase
          .from('naesin_student_progress')
          .update({ total_learning_seconds: (existing.total_learning_seconds || 0) + seconds })
          .eq('student_id', user.id)
          .eq('unit_id', contextId));
      } else {
        dbResult(await supabase
          .from('naesin_student_progress')
          .insert({
            student_id: user.id,
            unit_id: contextId,
            total_learning_seconds: seconds,
          }));
      }
    } else {
      // voca
      const { data: existing } = await supabase
        .from('voca_student_progress')
        .select('total_learning_seconds')
        .eq('student_id', user.id)
        .eq('day_id', contextId)
        .maybeSingle();

      if (existing) {
        dbResult(await supabase
          .from('voca_student_progress')
          .update({ total_learning_seconds: (existing.total_learning_seconds || 0) + seconds })
          .eq('student_id', user.id)
          .eq('day_id', contextId));
      } else {
        dbResult(await supabase
          .from('voca_student_progress')
          .insert({
            student_id: user.id,
            day_id: contextId,
            total_learning_seconds: seconds,
          }));
      }
    }

    return NextResponse.json({ success: true });
  }
);
