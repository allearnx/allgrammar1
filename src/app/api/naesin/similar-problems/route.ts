import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
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

    const data = dbResult(await query);
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

    const data = dbResult(await supabase
      .from('naesin_similar_problems')
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    dbResult(await supabase
      .from('naesin_similar_problems')
      .delete()
      .eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
