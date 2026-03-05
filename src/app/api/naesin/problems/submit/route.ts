import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError } from '@/lib/api';
import { problemSubmitSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: problemSubmitSchema },
  async ({ user, body, supabase }) => {
    const { sheetId, unitId, answers, totalQuestions } = body;

    // Fetch answer key
    const { data: sheet } = await supabase
      .from('naesin_problem_sheets')
      .select('answer_key, questions, mode')
      .eq('id', sheetId)
      .single();

    if (!sheet) throw new NotFoundError('시험지를 찾을 수 없습니다.');

    // Grade
    const answerKey = sheet.answer_key as (string | number)[];
    let correctCount = 0;
    const wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[] = [];

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = String(answers[i] ?? '').trim().toLowerCase();
      const correctAnswer = String(answerKey[i] ?? '').trim().toLowerCase();

      if (userAnswer === correctAnswer) {
        correctCount++;
      } else {
        const questions = sheet.questions as { number: number; question: string }[];
        wrongAnswers.push({
          number: i + 1,
          userAnswer: (answers[i] as string | number) ?? '',
          correctAnswer: answerKey[i] ?? '',
          question: questions?.[i]?.question,
        });
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100);

    // Save attempt
    const { data: attempt, error } = await supabase
      .from('naesin_problem_attempts')
      .insert({
        student_id: user.id,
        sheet_id: sheetId,
        answers,
        score,
        total_questions: totalQuestions,
        wrong_answers: wrongAnswers,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Save wrong answers to unified table
    if (wrongAnswers.length > 0 && unitId) {
      const wrongRows = wrongAnswers.map((wa) => ({
        student_id: user.id,
        unit_id: unitId,
        stage: 'problem',
        source_type: sheet.mode,
        question_data: wa,
      }));

      await supabase.from('naesin_wrong_answers').insert(wrongRows);
    }

    // Update progress if needed
    if (unitId) {
      await supabase
        .from('naesin_student_progress')
        .upsert(
          { student_id: user.id, unit_id: unitId, problem_completed: true },
          { onConflict: 'student_id,unit_id' }
        );
    }

    return NextResponse.json({ attempt, score, correctCount, wrongAnswers });
  }
);
