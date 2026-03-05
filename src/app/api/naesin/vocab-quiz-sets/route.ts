import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { vocabQuizSetCreateSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  {},
  async ({ supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

    const { data, error } = await supabase
      .from('naesin_vocab_quiz_sets')
      .select('*')
      .eq('unit_id', unitId)
      .order('set_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: vocabQuizSetCreateSchema },
  async ({ body, supabase }) => {
    const { unitId, title, vocabIds } = body;

    // Get next set_order
    const { data: existing } = await supabase
      .from('naesin_vocab_quiz_sets')
      .select('set_order')
      .eq('unit_id', unitId)
      .order('set_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.set_order ?? 0) + 1;

    const { data, error } = await supabase
      .from('naesin_vocab_quiz_sets')
      .insert({
        unit_id: unitId,
        title,
        set_order: nextOrder,
        vocab_ids: vocabIds,
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
    const { error } = await supabase
      .from('naesin_vocab_quiz_sets')
      .delete()
      .eq('id', body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
