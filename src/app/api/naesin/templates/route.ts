import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { templateCreateSchema, templatePatchSchema } from '@/lib/api/schemas';

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
  { roles: ['boss'], schema: templateCreateSchema },
  async ({ body, supabase, user }) => {
    const { title, templateTopic, questions, answerKey, category, mode } = body;

    const inserted = dbResult(await supabase
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
  { roles: ['boss'], schema: templatePatchSchema },
  async ({ body, supabase }) => {
    const { id, title, templateTopic, questions, answerKey } = body;

    const updates: Record<string, unknown> = {};
    if (title != null) updates.title = title;
    if (templateTopic != null) updates.template_topic = templateTopic;
    if (questions != null) updates.questions = questions;
    if (answerKey != null) updates.answer_key = answerKey;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
    }

    const updated = dbResult(await supabase
      .from('naesin_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    return NextResponse.json(updated);
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'] },
  async ({ supabase, request }) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    dbResult(await supabase
      .from('naesin_templates')
      .delete()
      .eq('id', id));

    return NextResponse.json({ ok: true });
  }
);
