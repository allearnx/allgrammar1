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

  // 스태프는 자기 학원 학생 결과만 조회 (boss는 전체)
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, academy_id')
    .eq('id', user.id)
    .single();

  const isStaff = ['teacher', 'admin', 'boss'].includes(currentUser?.role || '');
  let targetStudentId = user.id;
  if (isStaff && studentId && studentId !== user.id) {
    if (currentUser?.role !== 'boss') {
      const { data: target } = await supabase
        .from('users')
        .select('academy_id')
        .eq('id', studentId)
        .single();
      if (!target || !currentUser?.academy_id || target.academy_id !== currentUser.academy_id) {
        return NextResponse.json({ error: '해당 학생에 대한 접근 권한이 없습니다.' }, { status: 403 });
      }
    }
    targetStudentId = studentId;
  }

  const data = dbResult(await supabase
    .from('naesin_vocab_quiz_results')
    .select('*')
    .eq('student_id', targetStudentId)
    .eq('unit_id', unitId)
    .order('attempt_number', { ascending: true }));
  return NextResponse.json({ results: data });
}
