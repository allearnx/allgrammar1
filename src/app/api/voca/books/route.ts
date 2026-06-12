import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaBookCreateSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { createAdminClient } from '@/lib/supabase/admin';
import { cached, TTL } from '@/lib/cache/server-cache';
import { cacheTags } from '@/lib/cache/tags';
import { invalidateVocaBooks } from '@/lib/cache/invalidate';
import { VOCA_BOOKS_COLUMNS } from '@/types/voca';

const getCachedVocaBooks = cached(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('voca_books')
      .select(VOCA_BOOKS_COLUMNS)
      .order('sort_order');
    return data || [];
  },
  'voca-books',
  TTL.CONTENT,
  () => [cacheTags.vocaBooks()],
);

// GET — 교재 목록 (캐시 5min)
export const GET = createApiHandler({ hasBody: false }, async () => {
  const data = await getCachedVocaBooks();
  return NextResponse.json(data);
});

// POST — 교재 생성
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaBookCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { data, error } = await supabase
      .from('voca_books')
      .insert(body)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    invalidateVocaBooks();
    return NextResponse.json(data);
  }
);
