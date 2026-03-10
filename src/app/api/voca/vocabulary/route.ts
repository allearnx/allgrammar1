import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaVocabCreateSchema, vocaVocabPatchSchema, idSchema } from '@/lib/api/schemas';

// GET — 단어 목록 (dayId 쿼리 파라미터)
export const GET = createApiHandler({ hasBody: false }, async ({ request, supabase }) => {
  const { searchParams } = new URL(request.url);
  const dayId = searchParams.get('dayId');
  if (!dayId) return NextResponse.json({ error: 'dayId is required' }, { status: 400 });

  const { data } = await supabase
    .from('voca_vocabulary')
    .select('*')
    .eq('day_id', dayId)
    .order('sort_order');
  return NextResponse.json(data || []);
});

// POST — 단어 생성
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaVocabCreateSchema },
  async ({ body, supabase }) => {
    const { data, error } = await supabase
      .from('voca_vocabulary')
      .insert(body)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// PATCH — 단어 수정
export const PATCH = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaVocabPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body as Record<string, unknown>;
    const { data, error } = await supabase
      .from('voca_vocabulary')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// DELETE — 단어 삭제
export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    const { error } = await supabase
      .from('voca_vocabulary')
      .delete()
      .eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
);
