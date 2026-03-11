import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { omrSubmitSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: omrSubmitSchema },
  async ({ user, body, supabase }) => {
    const { unitId, omrSheetId, studentAnswers, correctCount, totalQuestions, scorePercent } = body;

    dbResult(await supabase
      .from('naesin_omr_attempts')
      .insert({
        student_id: user.id,
        omr_sheet_id: omrSheetId,
        student_answers: studentAnswers,
        correct_count: correctCount,
        total_questions: totalQuestions,
        score_percent: scorePercent,
      }));

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert(
        {
          student_id: user.id,
          unit_id: unitId,
          omr_completed: true,
        },
        { onConflict: 'student_id,unit_id' }
      ));
    return NextResponse.json({ success: true, omrCompleted: true });
  }
);
