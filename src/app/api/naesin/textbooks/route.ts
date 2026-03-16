import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { textbookCreateSchema, textbookPatchSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: textbookCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { grade, publisher, display_name, sort_order } = body;

    const data = dbResult(await supabase
      .from('naesin_textbooks')
      .insert({ grade, publisher, display_name, sort_order: sort_order || 0 })
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: textbookPatchSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { id, ...updates } = body;

    const data = dbResult(await supabase
      .from('naesin_textbooks')
      .update(updates)
      .eq('id', id)
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    dbResult(await supabase.from('naesin_textbooks').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
