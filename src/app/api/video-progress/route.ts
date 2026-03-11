import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { legacyVideoProgressSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: legacyVideoProgressSchema },
  async ({ user, body, supabase }) => {
    const { grammarId, position, completed } = body;

    dbResult(await supabase
      .from('student_progress')
      .upsert(
        {
          student_id: user.id,
          grammar_id: grammarId,
          video_last_position: Math.floor(position),
          video_watched_seconds: Math.floor(position),
          video_completed: completed || false,
        },
        {
          onConflict: 'student_id,grammar_id',
        }
      ));
    return NextResponse.json({ success: true });
  }
);
