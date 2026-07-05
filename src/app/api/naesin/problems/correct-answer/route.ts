import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, NotFoundError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPlanGate } from '@/lib/billing/check-plan-api';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';
import { requireContentPermission } from '@/lib/api/require-content-permission';

const correctAnswerSchema = z.object({
  sheetId: z.string().uuid(),
  questionIndex: z.number().int().min(0),
  newAnswer: z.union([z.string(), z.number()]),
  mode: z.enum(['replace', 'accept']).default('replace'),
  newExplanation: z.string().optional(),
});

export const PATCH = createApiHandler(
  { schema: correctAnswerSchema, roles: ['teacher', 'admin', 'boss'] },
  async ({ user, body, supabase }) => {
    // 정답처리는 전역 공유 시트·템플릿을 수정 → 콘텐츠 권한 학원(올라영)+보스만 (2026-07-05 결정)
    await requireContentPermission(user, supabase);
    if (user.role !== 'boss') {
      const blocked = await checkPlanGate(user.academy_id, 'naesin:problem');
      if (blocked) return blocked;
    }
    const { sheetId, questionIndex, newAnswer, mode, newExplanation } = body;

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
      explanation?: string;
    }[];

    if (questionIndex >= answerKey.length) {
      throw new NotFoundError('문항 번호가 범위를 벗어났습니다.');
    }

    // 2. questions 배열이 비었으면 (image_answer 모드) 최소 엔트리 생성
    while (questions.length <= questionIndex) {
      questions.push({
        number: questions.length + 1,
        question: '',
        answer: answerKey[questions.length] ?? '',
      });
    }

    // 3. 정답 업데이트
    if (mode === 'accept') {
      const existing = questions[questionIndex].acceptedAnswers ?? [];
      const newVal = String(newAnswer);
      if (!existing.includes(newVal)) {
        questions[questionIndex].acceptedAnswers = [...existing, newVal];
      }
    } else {
      answerKey[questionIndex] = newAnswer;
      questions[questionIndex].answer = newAnswer;
    }

    // 해설 업데이트 (정답 수정/정답처리 모두 가능)
    if (newExplanation !== undefined) {
      questions[questionIndex].explanation = newExplanation || undefined;
    }

    await admin
      .from('naesin_problem_sheets')
      .update({ answer_key: answerKey, questions })
      .eq('id', sheetId);

    // 4. 원본 템플릿에도 동기화 (source_template_id가 있는 경우)
    const { data: sheetFull } = await admin
      .from('naesin_problem_sheets')
      .select('source_template_id')
      .eq('id', sheetId)
      .single();

    let templateSynced = false;
    if (sheetFull?.source_template_id) {
      const { data: tmpl } = await admin
        .from('naesin_templates')
        .select('id, questions')
        .eq('id', sheetFull.source_template_id)
        .single();

      if (tmpl) {
        const tmplQuestions = tmpl.questions as typeof questions;
        if (tmplQuestions[questionIndex]) {
          if (mode === 'accept') {
            const existing = tmplQuestions[questionIndex].acceptedAnswers ?? [];
            const newVal = String(newAnswer);
            if (!existing.includes(newVal)) {
              tmplQuestions[questionIndex].acceptedAnswers = [...existing, newVal];
            }
          } else {
            tmplQuestions[questionIndex].answer = newAnswer;
          }
          if (newExplanation !== undefined) {
            tmplQuestions[questionIndex].explanation = newExplanation || undefined;
          }
          const tmplAnswerKey = tmplQuestions.map((q) => q.answer);
          await admin
            .from('naesin_templates')
            .update({ questions: tmplQuestions, answer_key: tmplAnswerKey })
            .eq('id', tmpl.id);
          templateSynced = true;
        }
      }
    }

    // 5. 재채점
    const result = await regradeSheet(sheetId);

    return NextResponse.json({ updated: true, templateSynced, ...result });
  }
);
