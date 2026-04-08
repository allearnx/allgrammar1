import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError, dbResult } from '@/lib/api';
import { problemSubmitSchema } from '@/lib/api/schemas';
import { normalize } from '@/lib/naesin/normalize-answer';

export const maxDuration = 60;

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
    const questions = sheet.questions as { number: number; question: string; options?: string[]; acceptedAnswers?: string[]; explanation?: string }[];
    let correctCount = 0;
    const wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[] = [];

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = String(answers[i] ?? '');
      const correctAnswer = String(answerKey[i] ?? '');
      const isSubjective = !questions?.[i]?.options || questions[i].options!.length === 0;

      let isCorrect: boolean;

      if (isSubjective) {
        // 규칙 기반 정규화 채점: aiResults가 있으면 score === 100, 없으면 정규화 비교
        const aiResult = aiResults?.[String(i)];
        if (aiResult) {
          isCorrect = aiResult.score === 100;
        } else {
          const studentNorm = normalize(userAnswer);
          const candidates = [correctAnswer, ...(questions?.[i]?.acceptedAnswers ?? [])];
          isCorrect = candidates.some((c) => normalize(c) === studentNorm);
        }
      } else {
        isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      }

      if (isCorrect) {
        correctCount++;
      } else {
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

    // Save wrong answers to unified table with enriched data
    if (wrongAnswers.length > 0 && unitId) {
      // 같은 시트의 이전 오답 정리 (재시도 시 중복 방지)
      dbResult(await supabase
        .from('naesin_wrong_answers')
        .delete()
        .eq('student_id', user.id)
        .eq('sheet_id', sheetId));

      const wrongRows = wrongAnswers.map((wa) => {
        const idx = wa.number - 1;
        const q = questions?.[idx];
        return {
          student_id: user.id,
          unit_id: unitId,
          stage: 'problem',
          source_type: sheet.mode,
          question_data: {
            ...wa,
            ...(q?.options ? { options: q.options } : {}),
            ...(q?.explanation ? { explanation: q.explanation } : {}),
          },
          sheet_id: sheetId,
        };
      });

      dbResult(await supabase.from('naesin_wrong_answers').insert(wrongRows));
    }

    // Delete server draft on successful submit
    dbResult(await supabase
      .from('naesin_problem_drafts')
      .delete()
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId));

    // Update progress: mark completed only when all sheets in the unit have been attempted
    if (unitId) {
      const { data: allSheets } = await supabase
        .from('naesin_problem_sheets')
        .select('id')
        .eq('unit_id', unitId)
        .eq('category', 'problem');
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
    }

    return NextResponse.json({ attempt, score, correctCount, wrongAnswers });
  }
);
