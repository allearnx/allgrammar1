import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { similarProblemPatchSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  {},
  async ({ supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    const status = request.nextUrl.searchParams.get('status');
    if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

    let query = supabase
      .from('naesin_similar_problems')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: similarProblemPatchSchema },
  async ({ user, body, supabase }) => {
    const { id, status, questionData } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) {
      updates.status = status;
      updates.reviewed_by = user.id;
    }
    if (questionData) updates.question_data = questionData;

    const { data, error } = await supabase
      .from('naesin_similar_problems')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    const { error } = await supabase
      .from('naesin_similar_problems')
      .delete()
      .eq('id', body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
