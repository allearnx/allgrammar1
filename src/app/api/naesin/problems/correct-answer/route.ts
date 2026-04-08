import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, NotFoundError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPlanGate } from '@/lib/billing/check-plan-api';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const correctAnswerSchema = z.object({
  sheetId: z.string().uuid(),
  questionIndex: z.number().int().min(0),
  newAnswer: z.union([z.string(), z.number()]),
  mode: z.enum(['replace', 'accept']).default('replace'),
});

export const PATCH = createApiHandler(
  { schema: correctAnswerSchema, roles: ['teacher', 'admin', 'boss'] },
  async ({ user, body, supabase }) => {
    if (user.role !== 'boss') {
      const blocked = await checkPlanGate(user.academy_id, 'naesin:problem');
      if (blocked) return blocked;
    }
    const { sheetId, questionIndex, newAnswer, mode } = body;

    const admin = createAdminClient();

    // 1. 시트 조회
    const { data: sheet } = await admin
      .from('naesin_problem_sheets')
      .select('id, answer_key, questions')
      .eq('id', sheetId)
      .single();

    if (!sheet) throw new NotFoundError('시험지를 찾을 수 없습니다.');

    const answerKey = sheet.answer_key as (string | number)[];
    const questions = sheet.questions as {
      number: number;
      question: string;
      options?: string[];
      answer: string | number;
      acceptedAnswers?: string[];
    }[];

    if (questionIndex >= answerKey.length) {
      throw new NotFoundError('문항 번호가 범위를 벗어났습니다.');
    }

    // 2. 정답 업데이트
    if (mode === 'accept') {
      if (questions[questionIndex]) {
        const existing = questions[questionIndex].acceptedAnswers ?? [];
        const newVal = String(newAnswer);
        if (!existing.includes(newVal)) {
          questions[questionIndex].acceptedAnswers = [...existing, newVal];
        }
      }
    } else {
      answerKey[questionIndex] = newAnswer;
      if (questions[questionIndex]) {
        questions[questionIndex].answer = newAnswer;
      }
    }

    await admin
      .from('naesin_problem_sheets')
      .update({ answer_key: answerKey, questions })
      .eq('id', sheetId);

    // 3. 재채점
    const result = await regradeSheet(sheetId);

    return NextResponse.json({ updated: true, ...result });
  }
);
