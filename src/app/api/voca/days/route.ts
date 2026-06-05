import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaDayCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { createAdminClient } from '@/lib/supabase/admin';
import { cached, TTL } from '@/lib/cache/server-cache';
import { cacheTags } from '@/lib/cache/tags';
import { invalidateVocaContent } from '@/lib/cache/invalidate';

const getCachedVocaDays = cached(
  async (bookId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('voca_days')
      .select('*')
      .eq('book_id', bookId)
      .order('sort_order');
    return data || [];
  },
  'voca-days',
  TTL.CONTENT,
  (bookId) => [cacheTags.vocaContent(bookId)],
);

// GET — Day 목록 (캐시 5min)
export const GET = createApiHandler({ hasBody: false }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');
  if (!bookId) return NextResponse.json({ error: 'bookId is required' }, { status: 400 });

  const data = await getCachedVocaDays(bookId);
  return NextResponse.json(data);
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
    if (body.book_id) invalidateVocaContent(body.book_id);
    return NextResponse.json(data);
  }
);

// DELETE — Day 삭제
export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    // 삭제 전 bookId 조회 (캐시 무효화용)
    const { data: day } = await supabase
      .from('voca_days')
      .select('book_id')
      .eq('id', body.id)
      .single();

    const { error } = await supabase
      .from('voca_days')
      .delete()
      .eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (day?.book_id) invalidateVocaContent(day.book_id);
    return NextResponse.json({ success: true });
  }
);
