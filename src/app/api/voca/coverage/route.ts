import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { computeVocaCoverage } from '@/lib/voca/coverage';

// GET ?bookId= — 학생 본인의 시험 커버리지 (RLS로 본인 진도만 조회됨)
export const GET = createApiHandler(
  { roles: ['student'], hasBody: false, rateLimit: { max: 60 } },
  async ({ request, user, supabase }) => {
    const bookId = new URL(request.url).searchParams.get('bookId');
    if (!bookId) return NextResponse.json({ error: 'bookId required' }, { status: 400 });

    const result = await computeVocaCoverage(supabase, user.id, bookId);
    return NextResponse.json(result);
  }
);
