import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { textbookCreateSchema, textbookPatchSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: textbookCreateSchema },
  async ({ body, supabase }) => {
    const { grade, publisher, display_name, sort_order } = body;

    const { data, error } = await supabase
      .from('naesin_textbooks')
      .insert({ grade, publisher, display_name, sort_order: sort_order || 0 })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: textbookPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('naesin_textbooks')
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
    const { error } = await supabase.from('naesin_textbooks').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
