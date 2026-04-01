import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeActivityLog } from '@/lib/reports/compute-activity-log';
import { format, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentIdParam = searchParams.get('studentId');

  let targetStudentId: string;

  if (user.role === 'student') {
    targetStudentId = user.id;
  } else if (['teacher', 'admin', 'boss'].includes(user.role)) {
    if (!studentIdParam) {
      return NextResponse.json({ error: 'studentId가 필요합니다.' }, { status: 400 });
    }
    targetStudentId = studentIdParam;

    if (user.role !== 'boss') {
      const supabaseForCheck = await createClient();
      const { data: student } = await supabaseForCheck
        .from('users')
        .select('academy_id')
        .eq('id', targetStudentId)
        .single();
      if (!student || student.academy_id !== user.academy_id) {
        return NextResponse.json({ error: '해당 학생에 대한 접근 권한이 없습니다.' }, { status: 403 });
      }
    }
  } else {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const queryClient = user.role === 'student' ? await createClient() : createAdminClient();
  const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

  // Fetch daily learning seconds
  const { data: dailyRows } = await queryClient
    .from('learning_daily_log')
    .select('date, seconds')
    .eq('student_id', targetStudentId)
    .gte('date', ninetyDaysAgo);

  const dailySeconds: Record<string, number> = {};
  if (dailyRows) {
    for (const row of dailyRows) {
      const d = row.date;
      dailySeconds[d] = (dailySeconds[d] || 0) + row.seconds;
    }
  }

  // Fetch activity log (reuse existing compute logic)
  const [
    vocaQuizActivityRes, vocaMatchingActivityRes,
    naesinVocabActivityRes, naesinProblemActivityRes,
    naesinPassageActivityRes, naesinVideoActivityRes,
  ] = await Promise.all([
    queryClient.from('voca_quiz_results').select('score, created_at, day_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    queryClient.from('voca_matching_submissions').select('score, created_at, day_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    queryClient.from('naesin_vocab_quiz_set_results').select('score, created_at, unit_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    queryClient.from('naesin_problem_attempts').select('score, total_questions, created_at, unit_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    queryClient.from('naesin_passage_attempts').select('created_at, unit_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    queryClient.from('naesin_grammar_video_progress').select('created_at, unit_id').eq('student_id', targetStudentId).eq('completed', true).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
  ]);

  const activities = await computeActivityLog(
    queryClient,
    vocaQuizActivityRes.data || [],
    vocaMatchingActivityRes.data || [],
    naesinVocabActivityRes.data || [],
    naesinProblemActivityRes.data || [],
    naesinPassageActivityRes.data || [],
    naesinVideoActivityRes.data || [],
  );

  return NextResponse.json({ dailySeconds, activities });
}
