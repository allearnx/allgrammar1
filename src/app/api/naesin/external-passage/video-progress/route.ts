import { NextResponse } from 'next/server';
import { createApiHandler, dbResult, ValidationError } from '@/lib/api';
import { textbookVideoProgressSchema } from '@/lib/api/schemas';

const COMPLETION_THRESHOLD = 80;

// POST: upsert video progress (called by NaesinYouTubePlayerTracked every 10s)
export const POST = createApiHandler(
  { schema: textbookVideoProgressSchema },
  async ({ user, body, supabase }) => {
    const { lessonId: sheetId, position, duration, cumulativeSeconds } = body;

    const { data: existing } = await supabase
      .from('naesin_ep_video_progress')
      .select('max_position_reached, duration, cumulative_watch_seconds, last_position')
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId)
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
      .from('naesin_ep_video_progress')
      .upsert(
        {
          student_id: user.id,
          sheet_id: sheetId,
          watch_percent: watchPercent,
          max_position_reached: maxPosition,
          duration: videoDuration,
          cumulative_watch_seconds: cumulative,
          last_position: position ?? existing?.last_position ?? 0,
          completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,sheet_id' }
      ));

    return NextResponse.json({ watchPercent, completed });
  }
);

// GET: load initial progress for resume playback
export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
    const sheetId = new URL(request.url).searchParams.get('sheetId');
    if (!sheetId) throw new ValidationError('sheetId가 필요합니다.');

    const { data } = await supabase
      .from('naesin_ep_video_progress')
      .select('id, watch_percent, max_position_reached, duration, cumulative_watch_seconds, last_position, completed')
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId)
      .single();

    return NextResponse.json({ progress: data });
  }
);
