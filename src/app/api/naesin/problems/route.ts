import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { problemCreateSchema, problemPatchSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';
import { syncSheetToTemplate } from '@/lib/naesin/sync-template';
import type { NaesinProblemQuestion } from '@/types/naesin';
import { sanitizeQuestions, validateBeforeSave } from '@/lib/validation/problem-validator';
import { spotCheckMcqAnswers } from '@/lib/validation/problem-answer-check';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic();

export const maxDuration = 30;

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  {},
  async ({ supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    const textbookId = request.nextUrl.searchParams.get('textbookId');
    const category = request.nextUrl.searchParams.get('category') || 'problem';
    if (!unitId && !textbookId) return NextResponse.json({ error: 'Missing unitId or textbookId' }, { status: 400 });

    let query = supabase
      .from('naesin_problem_sheets')
      .select('*')
      .eq('category', category)
      .order('sort_order');

    if (textbookId) {
      query = query.eq('textbook_id', textbookId);
    } else {
      query = query.eq('unit_id', unitId!);
    }

    const data = dbResult(await query);
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: problemCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { unitId, textbookId, title, mode, questions: rawQuestions, pdfUrl, answerKey: rawAnswerKey, category, videoUrl } = body;

    // Sanitize questions before saving (normalize answers, flatten arrays)
    const hasQuestions = Array.isArray(rawQuestions) && rawQuestions.length > 0;
    const { questions: sanitizedQuestions, answerKey: sanitizedAnswerKey } = hasQuestions
      ? sanitizeQuestions(rawQuestions, rawAnswerKey as (string | number | null)[] | undefined)
      : { questions: rawQuestions || [], answerKey: rawAnswerKey || [] };

    // Validate: block save if critical errors exist (empty answers, out-of-range MCQ, etc.)
    if (hasQuestions) {
      const validation = validateBeforeSave(sanitizedQuestions as NaesinProblemQuestion[]);
      if (!validation.valid) {
        return NextResponse.json(
          { error: '문제 데이터에 오류가 있습니다.', issues: validation.errors },
          { status: 422 },
        );
      }
    }

    const insertData: Record<string, unknown> = {
      unit_id: unitId || null,
      textbook_id: textbookId || null,
      title,
      mode,
      questions: sanitizedQuestions,
      pdf_url: pdfUrl || null,
      answer_key: sanitizedAnswerKey,
      category: category || 'problem',
    };
    if (videoUrl) insertData.video_url = videoUrl;

    const data = dbResult(await supabase
      .from('naesin_problem_sheets')
      .insert(insertData)
      .select()
      .single());

    // AI 정답 스팟체크 (새 시트 생성 시)
    const extras: Record<string, unknown> = {};
    if (hasQuestions) {
      try {
        const aiWarnings = await spotCheckMcqAnswers(
          sanitizedQuestions as NaesinProblemQuestion[],
          anthropic,
        );
        if (aiWarnings.length > 0) extras.aiWarnings = aiWarnings;
      } catch (err) {
        logger.error('problems.post.spot_check', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ ...data, ...extras });
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: problemPatchSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { id, ...updates } = body as Record<string, unknown>;

    // is_template / template_topic 변경은 boss만 가능
    if (('is_template' in updates || 'template_topic' in updates) && user.role !== 'boss') {
      return NextResponse.json({ error: '템플릿 설정은 boss만 가능합니다' }, { status: 403 });
    }

    // Sanitize questions on update too
    if ('questions' in updates && Array.isArray(updates.questions) && updates.questions.length > 0) {
      const { questions: sq, answerKey: sak } = sanitizeQuestions(
        updates.questions as NaesinProblemQuestion[],
        updates.answer_key as (string | number | null)[] | undefined,
      );
      updates.questions = sq;
      updates.answer_key = sak;

      // Validate: block save if critical errors exist
      const validation = validateBeforeSave(sq);
      if (!validation.valid) {
        return NextResponse.json(
          { error: '문제 데이터에 오류가 있습니다.', issues: validation.errors },
          { status: 422 },
        );
      }
    }

    const data = dbResult(await supabase
      .from('naesin_problem_sheets')
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    // questions 또는 answer_key 변경 시 자동 재채점 + 템플릿 동기화 + AI 스팟체크
    const questionsChanged = 'questions' in updates || 'answer_key' in updates;
    const extras: Record<string, unknown> = {};

    if (questionsChanged) {
      // 재채점
      await regradeSheet(id as string);

      // 템플릿 + 복사본 자동 동기화
      const templateSync = await syncSheetToTemplate(
        id as string,
        data.questions,
        data.answer_key,
      );
      if (templateSync.templateSynced) extras.templateSync = templateSync;

      // AI 정답 스팟체크 (non-blocking: 실패해도 저장은 완료)
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        try {
          const aiWarnings = await spotCheckMcqAnswers(
            data.questions as NaesinProblemQuestion[],
            anthropic,
          );
          if (aiWarnings.length > 0) extras.aiWarnings = aiWarnings;
        } catch (err) {
          logger.error('problems.patch.spot_check', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    return NextResponse.json({ ...data, ...extras });
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    dbResult(await supabase
      .from('naesin_problem_sheets')
      .delete()
      .eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
