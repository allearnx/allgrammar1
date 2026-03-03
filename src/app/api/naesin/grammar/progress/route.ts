import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { unitId, type } = await request.json();
  if (!unitId || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data: existing } = await supabase
    .from('naesin_student_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('unit_id', unitId)
    .single();

  const updates: Record<string, unknown> = {
    student_id: user.id,
    unit_id: unitId,
  };

  if (type === 'video') {
    updates.grammar_video_completed = true;
  } else if (type === 'text') {
    updates.grammar_text_read = true;
  }

  // Check if grammar stage should be completed
  // Either all videos watched OR all texts read (any lesson completion counts)
  const videoCompleted = type === 'video' ? true : (existing?.grammar_video_completed ?? false);
  const textRead = type === 'text' ? true : (existing?.grammar_text_read ?? false);
  updates.grammar_completed = videoCompleted || textRead;

  const { error } = await supabase
    .from('naesin_student_progress')
    .upsert(updates, { onConflict: 'student_id,unit_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, grammarCompleted: updates.grammar_completed });
}
