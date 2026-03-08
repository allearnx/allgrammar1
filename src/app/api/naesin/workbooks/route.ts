import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { workbookCreateSchema, workbookPatchSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  {},
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from('naesin_workbooks')
      .select('*')
      .eq('is_active', true)
      .order('grade')
      .order('sort_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: workbookCreateSchema },
  async ({ body, supabase }) => {
    const { data, error } = await supabase
      .from('naesin_workbooks')
      .insert({
        title: body.title,
        publisher: body.publisher,
        grade: body.grade,
        cover_image_url: body.cover_image_url || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: workbookPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('naesin_workbooks')
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
    const { error } = await supabase.from('naesin_workbooks').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
