import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { templateCreateSchema, templatePatchSchema } from '@/lib/api/schemas';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions, validateBeforeSave } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  { roles: [...ADMIN_ROLES] },
  async ({ supabase }) => {
    const data = dbResult(await supabase
      .from('naesin_templates')
      .select('id, title, questions, template_topic, category, created_at')
      .order('template_topic')
      .order('created_at', { ascending: false }));

    // topic별 그룹핑
    const grouped: Record<string, typeof data> = {};
    for (const row of data ?? []) {
      const topic = row.template_topic || '기타';
      if (!grouped[topic]) grouped[topic] = [];
      grouped[topic].push(row);
    }

    return NextResponse.json({ templates: data, grouped });
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: templateCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { title, templateTopic, questions: rawQuestions, answerKey: rawAnswerKey, category, mode } = body;
    const admin = createAdminClient();

    // Sanitize + validate
    const hasQ = Array.isArray(rawQuestions) && rawQuestions.length > 0;
    const { questions, answerKey } = hasQ
      ? sanitizeQuestions(rawQuestions as NaesinProblemQuestion[], rawAnswerKey as (string | number | null)[] | undefined)
      : { questions: rawQuestions || [], answerKey: rawAnswerKey || [] };

    if (hasQ) {
      const validation = validateBeforeSave(questions as NaesinProblemQuestion[]);
      if (!validation.valid) {
        return NextResponse.json(
          { error: '템플릿 데이터에 오류가 있습니다.', issues: validation.errors },
          { status: 422 },
        );
      }
    }

    const inserted = dbResult(await admin
      .from('naesin_templates')
      .insert({
        title,
        template_topic: templateTopic,
        questions,
        answer_key: answerKey,
        category,
        mode,
        created_by: user.id,
      })
      .select()
      .single());

    return NextResponse.json(inserted, { status: 201 });
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: templatePatchSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { id, title, templateTopic, questions, answerKey, syncCopies } = body;

    const updates: Record<string, unknown> = {};
    if (title != null) updates.title = title;
    if (templateTopic != null) updates.template_topic = templateTopic;

    // Sanitize + validate questions on update
    if (questions != null && Array.isArray(questions) && questions.length > 0) {
      const { questions: sq, answerKey: sak } = sanitizeQuestions(
        questions as NaesinProblemQuestion[],
        answerKey as (string | number | null)[] | undefined,
      );
      updates.questions = sq;
      updates.answer_key = sak;

      const validation = validateBeforeSave(sq);
      if (!validation.valid) {
        return NextResponse.json(
          { error: '템플릿 데이터에 오류가 있습니다.', issues: validation.errors },
          { status: 422 },
        );
      }
    } else {
      if (questions != null) updates.questions = questions;
      if (answerKey != null) updates.answer_key = answerKey;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
    }
    const admin = createAdminClient();

    const updated = dbResult(await admin
      .from('naesin_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    // 복사본 일괄 업데이트 (sanitized 값 사용)
    let syncedCount = 0;
    if (syncCopies && ('questions' in updates || 'answer_key' in updates)) {
      const sheetUpdates: Record<string, unknown> = {};
      if (updates.questions != null) sheetUpdates.questions = updates.questions;
      if (updates.answer_key != null) sheetUpdates.answer_key = updates.answer_key;

      const { data: synced } = await supabase
        .from('naesin_problem_sheets')
        .update(sheetUpdates)
        .eq('source_template_id', id)
        .select('id');

      syncedCount = synced?.length ?? 0;

      // synced 시트 자동 재채점
      if (synced && synced.length > 0) {
        await Promise.all(synced.map((s) => regradeSheet(s.id)));
      }
    }

    return NextResponse.json({ ...updated, syncedCount });
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES] },
  async ({ supabase, request, user }) => {
    await requireContentPermission(user, supabase);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    const admin = createAdminClient();

    dbResult(await admin
      .from('naesin_templates')
      .delete()
      .eq('id', id));

    return NextResponse.json({ ok: true });
  }
);
