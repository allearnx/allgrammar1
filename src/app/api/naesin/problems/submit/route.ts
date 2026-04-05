import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError, dbResult } from '@/lib/api';
import { problemSubmitSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: problemSubmitSchema },
  async ({ user, body, supabase }) => {
    const { sheetId, unitId, answers, totalQuestions, aiResults } = body;

    // Fetch answer key
    const { data: sheet } = await supabase
      .from('naesin_problem_sheets')
      .select('answer_key, questions, mode')
      .eq('id', sheetId)
      .single();

    if (!sheet) throw new NotFoundError('시험지를 찾을 수 없습니다.');

    // Grade
    const answerKey = sheet.answer_key as (string | number)[];
    const questions = sheet.questions as { number: number; question: string; options?: string[] }[];
    let correctCount = 0;
    const wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string; aiFeedback?: { score: number; feedback: string; correctedAnswer: string } }[] = [];

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = String(answers[i] ?? '').trim().toLowerCase();
      const correctAnswer = String(answerKey[i] ?? '').trim().toLowerCase();
      const aiResult = aiResults?.[String(i)];
      const isSubjective = !questions?.[i]?.options || questions[i].options!.length === 0;

      // Subjective with AI result: score >= 80 = correct
      const isCorrect = (isSubjective && aiResult)
        ? aiResult.score >= 80
        : userAnswer === correctAnswer;

      if (isCorrect) {
        correctCount++;
      } else {
        wrongAnswers.push({
          number: i + 1,
          userAnswer: (answers[i] as string | number) ?? '',
          correctAnswer: answerKey[i] ?? '',
          question: questions?.[i]?.question,
          ...(aiResult ? { aiFeedback: aiResult } : {}),
        });
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100);

    // Save attempt
    const attempt = dbResult(await supabase
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
      .single());

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

    // Delete server draft on successful submit
    await supabase
      .from('naesin_problem_drafts')
      .delete()
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId);

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
