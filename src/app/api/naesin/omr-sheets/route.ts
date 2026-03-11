import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { omrSheetCreateSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: omrSheetCreateSchema },
  async ({ body, supabase }) => {
    const data = dbResult(await supabase
      .from('naesin_omr_sheets')
      .insert({
        unit_id: body.unit_id,
        title: body.title,
        total_questions: body.total_questions,
        answer_key: body.answer_key,
        points_per_question: body.points_per_question || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    dbResult(await supabase.from('naesin_omr_sheets').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
