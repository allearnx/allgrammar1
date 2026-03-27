import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaMatchingSubmissionSchema, vocaMatchingReviewSchema } from '@/lib/api/schemas';

// POST — 오답 5번 쓰기 제출
export const POST = createApiHandler(
  { schema: vocaMatchingSubmissionSchema },
  async ({ user, body, supabase }) => {
    const { data, error } = await supabase
      .from('voca_matching_submissions')
      .insert({
        student_id: user.id,
        day_id: body.dayId,
        wrong_words: body.wrongWords,
        writings: body.writings,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// GET — 제출 목록 (teacher/admin/boss)
export const GET = createApiHandler({ roles: ['teacher', 'admin', 'boss'], hasBody: false }, async ({ request, supabase }) => {
  const { searchParams } = new URL(request.url);
  const dayId = searchParams.get('dayId');
  const status = searchParams.get('status');

  let query = supabase
    .from('voca_matching_submissions')
    .select('*, student:users!voca_matching_submissions_student_id_fkey(full_name, email)')
    .order('created_at', { ascending: false });

  if (dayId) query = query.eq('day_id', dayId);
  if (status) query = query.eq('status', status);

  const { data } = await query;
  return NextResponse.json(data || []);
});

// PATCH — 검토 완료 표시
export const PATCH = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaMatchingReviewSchema },
  async ({ user, body, supabase }) => {
    const { data, error } = await supabase
      .from('voca_matching_submissions')
      .update({ status: body.status, reviewed_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);
