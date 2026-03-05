import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { passageCreateSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: passageCreateSchema },
  async ({ body, supabase }) => {
    const { data, error } = await supabase
      .from('naesin_passages')
      .insert({
        unit_id: body.unit_id,
        title: body.title,
        original_text: body.original_text,
        korean_translation: body.korean_translation,
        blanks_easy: body.blanks_easy || null,
        blanks_medium: body.blanks_medium || null,
        blanks_hard: body.blanks_hard || null,
        sentences: body.sentences || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    const { error } = await supabase.from('naesin_passages').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
