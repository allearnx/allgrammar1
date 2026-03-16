import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaBookCreateSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

// GET — 교재 목록
export const GET = createApiHandler({ hasBody: false }, async ({ supabase }) => {
  const { data } = await supabase
    .from('voca_books')
    .select('*')
    .order('sort_order');
  return NextResponse.json(data || []);
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
    return NextResponse.json(data);
  }
);
