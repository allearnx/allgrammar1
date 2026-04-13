import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { passageSubmitSchema } from '@/lib/api/schemas';

export const maxDuration = 60;

export const POST = createApiHandler(
  { schema: passageSubmitSchema },
  async ({ user, body, supabase }) => {
    const { sheetId, unitId, orderingScore, translationScore, wrongSentences } = body;

    const score = Math.round((orderingScore + translationScore) / 2);
    const totalQuestions = 2; // ordering + translation exercises

    // Save attempt in the standard problem attempts table
    const attempt = dbResult(await supabase
      .from('naesin_problem_attempts')
      .insert({
        student_id: user.id,
        sheet_id: sheetId,
        answers: [orderingScore, translationScore],
        score,
        total_questions: totalQuestions,
        wrong_answers: wrongSentences.map((ws) => ({
          number: ws.number,
          userAnswer: ws.userAnswer,
          correctAnswer: ws.correctAnswer,
          question: `[${ws.type === 'ordering' ? '순서배열' : '영작'}] #${ws.number}`,
        })),
      })
      .select()
      .single());

    // Clean previous wrong answers for this sheet
    dbResult(await supabase
      .from('naesin_wrong_answers')
      .delete()
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId));

    // Save wrong answers
    if (wrongSentences.length > 0) {
      const wrongRows = wrongSentences.map((ws) => ({
        student_id: user.id,
        unit_id: unitId,
        stage: 'problem' as const,
        source_type: 'external_passage',
        question_data: {
          number: ws.number,
          userAnswer: ws.userAnswer,
          correctAnswer: ws.correctAnswer,
          question: `[${ws.type === 'ordering' ? '순서배열' : '영작'}] #${ws.number}`,
        },
        sheet_id: sheetId,
      }));

      dbResult(await supabase.from('naesin_wrong_answers').insert(wrongRows));
    }

    // Update progress: check if all problem-group sheets are attempted
    const { data: allSheets } = await supabase
      .from('naesin_problem_sheets')
      .select('id')
      .eq('unit_id', unitId)
      .in('category', ['problem', 'external_passage', 'eng_eng_def']);
    const sheetIds = (allSheets || []).map((s) => s.id);

    const { data: attemptRows } = await supabase
      .from('naesin_problem_attempts')
      .select('sheet_id')
      .eq('student_id', user.id)
      .in('sheet_id', sheetIds.length > 0 ? sheetIds : ['__none__']);
    const attemptedIds = new Set((attemptRows || []).map((r) => r.sheet_id));

    const allCompleted = sheetIds.length > 0 && sheetIds.every((id) => attemptedIds.has(id));

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert(
        { student_id: user.id, unit_id: unitId, problem_completed: allCompleted },
        { onConflict: 'student_id,unit_id' }
      ));

    return NextResponse.json({
      attempt,
      score,
      orderingScore,
      translationScore,
      wrongCount: wrongSentences.length,
    });
  },
);
