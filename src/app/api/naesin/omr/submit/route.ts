import { NextResponse } from 'next/server';
import { createApiHandler, dbResult, NotFoundError } from '@/lib/api';
import { omrSubmitSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: omrSubmitSchema },
  async ({ user, body, supabase }) => {
    const { unitId, omrSheetId, studentAnswers } = body;

    // Fetch answer key from DB
    const { data: sheet, error: sheetErr } = await supabase
      .from('naesin_omr_sheets')
      .select('answer_key, total_questions')
      .eq('id', omrSheetId)
      .single();

    if (sheetErr || !sheet) {
      throw new NotFoundError('OMR 시트를 찾을 수 없습니다.');
    }

    // Server-side grading
    const answerKey = sheet.answer_key as unknown[];
    const answers = Array.isArray(studentAnswers) ? studentAnswers : Object.values(studentAnswers);
    let correctCount = 0;
    for (let i = 0; i < sheet.total_questions; i++) {
      if (answers[i] === answerKey[i]) correctCount++;
    }
    const scorePercent = Math.round((correctCount / sheet.total_questions) * 100);

    dbResult(await supabase
      .from('naesin_omr_attempts')
      .insert({
        student_id: user.id,
        omr_sheet_id: omrSheetId,
        student_answers: studentAnswers,
        correct_count: correctCount,
        total_questions: sheet.total_questions,
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

    return NextResponse.json({
      success: true,
      omrCompleted: true,
      correctCount,
      totalQuestions: sheet.total_questions,
      scorePercent,
      answer_key: answerKey,
    });
  }
);
