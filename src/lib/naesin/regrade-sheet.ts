import { createAdminClient } from '@/lib/supabase/admin';
import { normalize, matchMcqAnswer } from '@/lib/naesin/normalize-answer';

/**
 * 시트 1개를 재채점하고 오답 테이블을 갱신한다.
 * admin client를 사용하므로 RLS를 우회한다.
 */
export async function regradeSheet(
  sheetId: string
): Promise<{ total: number; changed: number }> {
  const admin = createAdminClient();

  // 1. 시트 정보 조회
  const { data: sheet } = await admin
    .from('naesin_problem_sheets')
    .select('id, unit_id, answer_key, questions, mode')
    .eq('id', sheetId)
    .single();

  if (!sheet) return { total: 0, changed: 0 };

  // 2. 해당 시트의 모든 시도 조회
  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, student_id, answers, score, total_questions, wrong_answers')
    .eq('sheet_id', sheetId);

  if (!attempts || attempts.length === 0) {
    return { total: 0, changed: 0 };
  }

  const answerKey = sheet.answer_key as (string | number)[];
  const questions = sheet.questions as {
    number: number;
    question: string;
    options?: string[];
    acceptedAnswers?: string[];
  }[];

  let changed = 0;

  for (const attempt of attempts) {
    const answers = attempt.answers as (string | number)[];
    const totalQuestions = attempt.total_questions;
    let correctCount = 0;
    const wrongAnswers: {
      number: number;
      userAnswer: string | number;
      correctAnswer: string | number;
      question?: string;
    }[] = [];

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = String(answers[i] ?? '');
      const correctAnswer = String(answerKey[i] ?? '');
      const isSubjective =
        !questions?.[i]?.options || questions[i].options!.length === 0;

      let isCorrect: boolean;

      if (isSubjective) {
        const studentNorm = normalize(userAnswer);
        const candidates = [
          correctAnswer,
          ...(questions?.[i]?.acceptedAnswers ?? []),
        ];
        isCorrect = candidates.some((c) => normalize(c) === studentNorm);
      } else {
        isCorrect = matchMcqAnswer(userAnswer, correctAnswer, questions?.[i]?.options);
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

    const newScore = Math.round((correctCount / totalQuestions) * 100);

    // 점수 또는 오답 목록이 바뀌었는지 확인
    const oldWrongNums = ((attempt.wrong_answers ?? []) as { number: number }[])
      .map((w) => w.number).sort((a, b) => a - b).join(',');
    const newWrongNums = wrongAnswers
      .map((w) => w.number).sort((a, b) => a - b).join(',');
    const hasChange = newScore !== attempt.score || oldWrongNums !== newWrongNums;

    if (hasChange) {
      changed++;

      await admin
        .from('naesin_problem_attempts')
        .update({ score: newScore, wrong_answers: wrongAnswers })
        .eq('id', attempt.id);

      // 오답 테이블 갱신: 해당 시트의 problem 오답만 삭제 → 새 오답 삽입
      await admin
        .from('naesin_wrong_answers')
        .delete()
        .eq('student_id', attempt.student_id)
        .eq('unit_id', sheet.unit_id)
        .eq('stage', 'problem')
        .eq('sheet_id', sheetId);

      if (wrongAnswers.length > 0) {
        const wrongRows = wrongAnswers.map((wa) => ({
          student_id: attempt.student_id,
          unit_id: sheet.unit_id,
          stage: 'problem',
          source_type: sheet.mode,
          question_data: wa,
          sheet_id: sheetId,
        }));
        await admin.from('naesin_wrong_answers').insert(wrongRows);
      }
    }
  }

  return { total: attempts.length, changed };
}
