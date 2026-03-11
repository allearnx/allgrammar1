import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { workbookOmrSubmitSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: workbookOmrSubmitSchema },
  async ({ user, body, supabase }) => {
    const { omrSheetId, studentAnswers } = body;

    // Fetch answer key
    const { data: sheet, error: sheetErr } = await supabase
      .from('naesin_workbook_omr_sheets')
      .select('answer_key, total_questions')
      .eq('id', omrSheetId)
      .single();

    if (sheetErr || !sheet) {
      return NextResponse.json({ error: 'OMR 시트를 찾을 수 없습니다' }, { status: 404 });
    }

    // Grade
    const answerKey = sheet.answer_key as number[];
    let correctCount = 0;
    for (let i = 0; i < sheet.total_questions; i++) {
      if (studentAnswers[i] === answerKey[i]) correctCount++;
    }
    const scorePercent = Math.round((correctCount / sheet.total_questions) * 100);

    // Save attempt
    const attempt = dbResult(await supabase
      .from('naesin_workbook_omr_attempts')
      .insert({
        student_id: user.id,
        omr_sheet_id: omrSheetId,
        student_answers: studentAnswers,
        correct_count: correctCount,
        total_questions: sheet.total_questions,
        score_percent: scorePercent,
      })
      .select()
      .single());

    return NextResponse.json({
      ...attempt,
      answer_key: answerKey,
    });
  }
);
