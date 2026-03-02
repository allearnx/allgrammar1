import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { grammarId: string; position: number; completed: boolean };

  // Handle both JSON and sendBeacon (text/plain) content types
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const text = await request.text();
    body = JSON.parse(text);
  }

  const { grammarId, position, completed } = body;

  if (!grammarId || position === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await supabase
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
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
