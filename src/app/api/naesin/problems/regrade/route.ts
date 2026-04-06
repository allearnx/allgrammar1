import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, NotFoundError } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalize } from '@/lib/naesin/normalize-answer';

const regradeSchema = z.object({
  sheetId: z.string().uuid(),
});

export const POST = createApiHandler(
  { schema: regradeSchema, roles: ['teacher', 'admin', 'boss'] },
  async ({ user, body, supabase }) => {
    await requireContentPermission(user, supabase);
    const { sheetId } = body;

    // 1. 시트 정보 조회 (RLS 허용)
    const { data: sheet } = await supabase
      .from('naesin_problem_sheets')
      .select('id, unit_id, answer_key, questions, mode')
      .eq('id', sheetId)
      .single();

    if (!sheet) throw new NotFoundError('시험지를 찾을 수 없습니다.');

    // 2. 해당 시트의 모든 시도 조회 (teacher는 SELECT 가능)
    const { data: attempts } = await supabase
      .from('naesin_problem_attempts')
      .select('id, student_id, answers, score, total_questions, wrong_answers')
      .eq('sheet_id', sheetId);

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ total: 0, changed: 0 });
    }

    const answerKey = sheet.answer_key as (string | number)[];
    const questions = sheet.questions as {
      number: number;
      question: string;
      options?: string[];
      acceptedAnswers?: string[];
    }[];

    // Admin client for UPDATE/DELETE (teacher RLS = SELECT only)
    const admin = createAdminClient();

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
          isCorrect =
            userAnswer.trim().toLowerCase() ===
            correctAnswer.trim().toLowerCase();
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

      if (newScore !== attempt.score) {
        changed++;

        // 시도 점수 업데이트
        await admin
          .from('naesin_problem_attempts')
          .update({ score: newScore, wrong_answers: wrongAnswers })
          .eq('id', attempt.id);

        // 오답 테이블 갱신: 기존 problem 오답 삭제 → 새 오답 삽입
        await admin
          .from('naesin_wrong_answers')
          .delete()
          .eq('student_id', attempt.student_id)
          .eq('unit_id', sheet.unit_id)
          .eq('stage', 'problem');

        if (wrongAnswers.length > 0) {
          const wrongRows = wrongAnswers.map((wa) => ({
            student_id: attempt.student_id,
            unit_id: sheet.unit_id,
            stage: 'problem',
            source_type: sheet.mode,
            question_data: wa,
          }));
          await admin.from('naesin_wrong_answers').insert(wrongRows);
        }
      }
    }

    return NextResponse.json({ total: attempts.length, changed });
  }
);
