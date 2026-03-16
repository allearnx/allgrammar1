import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { problemCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  {},
  async ({ supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    const category = request.nextUrl.searchParams.get('category') || 'problem';
    if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

    const data = dbResult(await supabase
      .from('naesin_problem_sheets')
      .select('*')
      .eq('unit_id', unitId)
      .eq('category', category)
      .order('sort_order'));
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: problemCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { unitId, title, mode, questions, pdfUrl, answerKey, category } = body;

    const data = dbResult(await supabase
      .from('naesin_problem_sheets')
      .insert({
        unit_id: unitId,
        title,
        mode,
        questions: questions || [],
        pdf_url: pdfUrl || null,
        answer_key: answerKey || [],
        category: category || 'problem',
      })
      .select()
      .single());
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
