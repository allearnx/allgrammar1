import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { workbookOmrSheetCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  {},
  async ({ supabase, request }) => {
    const url = new URL(request.url);
    const workbookId = url.searchParams.get('workbookId');

    if (!workbookId) {
      return NextResponse.json({ error: 'workbookId is required' }, { status: 400 });
    }

    const data = dbResult(await supabase
      .from('naesin_workbook_omr_sheets')
      .select('*')
      .eq('workbook_id', workbookId)
      .order('sort_order'));
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: workbookOmrSheetCreateSchema },
  async ({ body, user, supabase }) => {
    await requireContentPermission(user, supabase);
    const data = dbResult(await supabase
      .from('naesin_workbook_omr_sheets')
      .insert({
        workbook_id: body.workbook_id,
        title: body.title,
        total_questions: body.total_questions,
        answer_key: body.answer_key,
        created_by: user.id,
        sort_order: body.sort_order || 0,
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
      .from('naesin_workbook_omr_sheets')
      .delete()
      .eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
