import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { problemCreateSchema, problemPatchSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';
import type { NaesinProblemQuestion } from '@/types/naesin';
import { sanitizeQuestions } from '@/lib/validation/problem-validator';

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
    return NextResponse.json(data);
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
    }

    const data = dbResult(await supabase
      .from('naesin_problem_sheets')
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    // questions 또는 answer_key 변경 시 자동 재채점
    if ('questions' in updates || 'answer_key' in updates) {
      await regradeSheet(id as string);
    }

    return NextResponse.json(data);
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
