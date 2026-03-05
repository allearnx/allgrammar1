import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { unitCreateSchema, unitPatchSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: unitCreateSchema },
  async ({ body, supabase }) => {
    const { textbook_id, unit_number, title, sort_order } = body;

    const { data, error } = await supabase
      .from('naesin_units')
      .insert({ textbook_id, unit_number, title, sort_order: sort_order || 0 })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: unitPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('naesin_units')
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
    const { error } = await supabase.from('naesin_units').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
