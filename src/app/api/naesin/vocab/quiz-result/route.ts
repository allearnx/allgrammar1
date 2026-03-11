import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { quizResultCreateSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: quizResultCreateSchema },
  async ({ user, body, supabase }) => {
    const { unitId, score, totalQuestions, correctCount, wrongWords } = body;

    // Get current max attempt_number for this student+unit
    const { data: latest } = await supabase
      .from('naesin_vocab_quiz_results')
      .select('attempt_number')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .single();

    const attemptNumber = (latest?.attempt_number ?? 0) + 1;

    const data = dbResult(await supabase
      .from('naesin_vocab_quiz_results')
      .insert({
        student_id: user.id,
        unit_id: unitId,
        attempt_number: attemptNumber,
        score,
        total_questions: totalQuestions,
        correct_count: correctCount,
        wrong_words: wrongWords || [],
      })
      .select()
      .single());
    return NextResponse.json({ result: data });
  }
);

// GET has special logic: resultId lookup works without auth (shared link)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // Single result by ID (for shared link — no auth required)
  const resultId = searchParams.get('resultId');
  if (resultId) {
    const { data, error } = await supabase
      .from('naesin_vocab_quiz_results')
      .select('*, users!student_id(full_name)')
      .eq('id', resultId)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ result: data });
  }

  // List results for a unit (requires auth)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' }, { status: 401 });

  const unitId = searchParams.get('unitId');
  const studentId = searchParams.get('studentId');
  if (!unitId) return NextResponse.json({ error: 'unitId required' }, { status: 400 });

  // Teachers/admins can view any student's results
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const targetStudentId = ['teacher', 'admin', 'boss'].includes(currentUser?.role || '')
    ? (studentId || user.id)
    : user.id;

  const data = dbResult(await supabase
    .from('naesin_vocab_quiz_results')
    .select('*')
    .eq('student_id', targetStudentId)
    .eq('unit_id', unitId)
    .order('attempt_number', { ascending: true }));
  return NextResponse.json({ results: data });
}
