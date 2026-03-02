import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is manager+
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['manager', 'admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { studentId } = await request.json();

  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
  }

  // Get student info
  const { data: student } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', studentId)
    .single();

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  // Gather stats in parallel
  const [videoRes, memoryRes, dueRes, textbookRes, grammarCountRes] = await Promise.all([
    supabase
      .from('student_progress')
      .select('video_completed, video_watched_seconds')
      .eq('student_id', studentId),
    supabase
      .from('student_memory_progress')
      .select('is_mastered, quiz_correct_count, quiz_wrong_count')
      .eq('student_id', studentId),
    supabase
      .from('student_memory_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('is_mastered', false)
      .lte('next_review_date', today),
    supabase
      .from('student_textbook_progress')
      .select('id')
      .eq('student_id', studentId),
    supabase
      .from('grammars')
      .select('id', { count: 'exact', head: true }),
  ]);

  const videoProg = videoRes.data || [];
  const memProg = memoryRes.data || [];

  const completedVideos = videoProg.filter((p) => p.video_completed).length;
  const totalWatched = videoProg.reduce((a, p) => a + p.video_watched_seconds, 0);
  const totalQuizCorrect = memProg.reduce((a, p) => a + p.quiz_correct_count, 0);
  const totalQuizWrong = memProg.reduce((a, p) => a + p.quiz_wrong_count, 0);
  const quizTotal = totalQuizCorrect + totalQuizWrong;

  const report = {
    student: `${student.full_name} (${student.email})`,
    generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
    videoProgress: {
      completed: completedVideos,
      total: grammarCountRes.count || 0,
    },
    memoryProgress: {
      mastered: memProg.filter((p) => p.is_mastered).length,
      total: memProg.length,
      dueReviews: dueRes.data?.length || 0,
    },
    textbookProgress: {
      completed: textbookRes.data?.length || 0,
    },
    totalWatchedMinutes: Math.round(totalWatched / 60),
    quizAccuracy: quizTotal > 0 ? Math.round((totalQuizCorrect / quizTotal) * 100) : 0,
  };

  return NextResponse.json(report);
}
