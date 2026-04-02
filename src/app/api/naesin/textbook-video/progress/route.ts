import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { textbookVideoProgressSchema } from '@/lib/api/schemas';

const COMPLETION_THRESHOLD = 80;

export const POST = createApiHandler(
  { schema: textbookVideoProgressSchema },
  async ({ user, body, supabase }) => {
    const { lessonId: videoId, unitId, position, duration, cumulativeSeconds } = body;

    // Get existing progress
    const { data: existing } = await supabase
      .from('naesin_textbook_video_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('video_id', videoId)
      .single();

    const maxPosition = Math.max(existing?.max_position_reached ?? 0, position ?? 0);
    const videoDuration = duration ?? existing?.duration ?? 0;
    const cumulative = Math.max(existing?.cumulative_watch_seconds ?? 0, cumulativeSeconds ?? 0);

    let watchPercent = 0;
    if (videoDuration > 0) {
      watchPercent = Math.min(100, Math.round((maxPosition / videoDuration) * 100));
    }

    const completed = watchPercent >= COMPLETION_THRESHOLD;

    dbResult(await supabase
      .from('naesin_textbook_video_progress')
      .upsert(
        {
          student_id: user.id,
          video_id: videoId,
          watch_percent: watchPercent,
          max_position_reached: maxPosition,
          duration: videoDuration,
          cumulative_watch_seconds: cumulative,
          last_position: position ?? existing?.last_position ?? 0,
          completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,video_id' }
      ));

    if (completed && unitId) {
      await updateTextbookVideoStageProgress(supabase, user.id, unitId);
    }

    return NextResponse.json({ watchPercent, completed });
  }
);

async function updateTextbookVideoStageProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  unitId: string
) {
  const { data: videos } = await supabase
    .from('naesin_textbook_videos')
    .select('id')
    .eq('unit_id', unitId);

  if (!videos || videos.length === 0) return;

  const { data: videoProgress } = await supabase
    .from('naesin_textbook_video_progress')
    .select('video_id, completed')
    .eq('student_id', studentId)
    .in('video_id', videos.map((v) => v.id));

  const completedCount = videoProgress?.filter((vp) => vp.completed).length ?? 0;
  const allCompleted = completedCount >= videos.length;

  await supabase
    .from('naesin_student_progress')
    .upsert(
      {
        student_id: studentId,
        unit_id: unitId,
        textbook_videos_completed: completedCount,
        textbook_total_videos: videos.length,
        textbook_video_completed: allCompleted,
      },
      { onConflict: 'student_id,unit_id' }
    );
}
