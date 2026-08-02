import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaDayCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { createAdminClient } from '@/lib/supabase/admin';
import { cached, TTL } from '@/lib/cache/server-cache';
import { cacheTags } from '@/lib/cache/tags';
import { invalidateVocaContent } from '@/lib/cache/invalidate';
import { VOCA_DAYS_COLUMNS } from '@/types/voca';

const getCachedVocaDays = cached(
  async (bookId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('voca_days')
      .select(VOCA_DAYS_COLUMNS)
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
    // 같은 번호 Day 중복 생성 차단 — 중복 Day는 플래시카드/시험 배정이 서로 다른
    // 사본을 가리켜 "학습 안 한 단어가 시험에 나오는" 사고가 됨 (2026-08-02 제보)
    const { data: dup } = await supabase
      .from('voca_days')
      .select('id')
      .eq('book_id', body.book_id)
      .eq('day_number', body.day_number)
      .limit(1);
    if (dup && dup.length > 0) {
      return NextResponse.json(
        { error: `이 교재에 Day ${body.day_number}이(가) 이미 있습니다. 기존 Day에 단어를 추가하거나 다른 번호를 사용하세요.` },
        { status: 409 },
      );
    }
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
