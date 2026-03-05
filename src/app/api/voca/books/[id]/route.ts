import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaBookPatchSchema } from '@/lib/api/schemas';

// PATCH — 교재 수정
export const PATCH = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaBookPatchSchema },
  async ({ body, params, supabase }) => {
    const { id, ...updates } = body as Record<string, unknown>;
    const bookId = params.id || id;
    const { data, error } = await supabase
      .from('voca_books')
      .update(updates)
      .eq('id', bookId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// DELETE — 교재 삭제
export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false },
  async ({ params, supabase }) => {
    const { error } = await supabase
      .from('voca_books')
      .delete()
      .eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
);
