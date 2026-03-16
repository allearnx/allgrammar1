import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaDayCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

// GET — Day 목록 (book_id 쿼리 파라미터)
export const GET = createApiHandler({ hasBody: false }, async ({ request, supabase }) => {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');
  if (!bookId) return NextResponse.json({ error: 'bookId is required' }, { status: 400 });

  const { data } = await supabase
    .from('voca_days')
    .select('*')
    .eq('book_id', bookId)
    .order('sort_order');
  return NextResponse.json(data || []);
});

// POST — Day 생성
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaDayCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { data, error } = await supabase
      .from('voca_days')
      .insert(body)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// DELETE — Day 삭제
export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { error } = await supabase
      .from('voca_days')
      .delete()
      .eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
);
