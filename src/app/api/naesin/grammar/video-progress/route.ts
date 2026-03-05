import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const COMPLETION_THRESHOLD = 80;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lessonId, unitId, position, duration, cumulativeSeconds } = await request.json();
  if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });

  // Get existing progress
  const { data: existing } = await supabase
    .from('naesin_grammar_video_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)
    .single();

  const maxPosition = Math.max(existing?.max_position_reached ?? 0, position ?? 0);
  const videoDuration = duration ?? existing?.duration ?? 0;
  const cumulative = Math.max(existing?.cumulative_watch_seconds ?? 0, cumulativeSeconds ?? 0);

  // Calculate watch percent from maxPositionReached / duration
  let watchPercent = 0;
  if (videoDuration > 0) {
    watchPercent = Math.min(100, Math.round((maxPosition / videoDuration) * 100));
  }

  const completed = watchPercent >= COMPLETION_THRESHOLD;

  const { error } = await supabase
    .from('naesin_grammar_video_progress')
    .upsert(
      {
        student_id: user.id,
        lesson_id: lessonId,
        watch_percent: watchPercent,
        max_position_reached: maxPosition,
        duration: videoDuration,
        cumulative_watch_seconds: cumulative,
        last_position: position ?? existing?.last_position ?? 0,
        completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,lesson_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If completed, update grammar stage progress
  if (completed && unitId) {
    await updateGrammarStageProgress(supabase, user.id, unitId);
  }

  return NextResponse.json({ watchPercent, completed });
}

async function updateGrammarStageProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  unitId: string
) {
  // Count total video lessons for this unit
  const { data: lessons } = await supabase
    .from('naesin_grammar_lessons')
    .select('id')
    .eq('unit_id', unitId)
    .eq('content_type', 'video');

  if (!lessons || lessons.length === 0) return;

  // Count completed videos
  const { data: videoProgress } = await supabase
    .from('naesin_grammar_video_progress')
    .select('lesson_id, completed')
    .eq('student_id', studentId)
    .in('lesson_id', lessons.map((l) => l.id));

  const completedCount = videoProgress?.filter((vp) => vp.completed).length ?? 0;
  const allCompleted = completedCount >= lessons.length;

  await supabase
    .from('naesin_student_progress')
    .upsert(
      {
        student_id: studentId,
        unit_id: unitId,
        grammar_videos_completed: completedCount,
        grammar_total_videos: lessons.length,
        grammar_completed: allCompleted,
      },
      { onConflict: 'student_id,unit_id' }
    );
}
