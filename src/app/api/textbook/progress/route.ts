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

  const { passageId, type, score } = await request.json();

  if (!passageId || !type || score === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Build update based on type
  const updates: Record<string, unknown> = {
    student_id: user.id,
    passage_id: passageId,
  };

  if (type.startsWith('fill_blanks_')) {
    const difficulty = type.replace('fill_blanks_', '') as 'easy' | 'medium' | 'hard';
    updates[`fill_blanks_${difficulty}_score`] = score;
    // Get current attempts to increment
    const { data: existing } = await supabase
      .from('student_textbook_progress')
      .select('fill_blanks_attempts')
      .eq('student_id', user.id)
      .eq('passage_id', passageId)
      .single();
    updates.fill_blanks_attempts = (existing?.fill_blanks_attempts || 0) + 1;
  } else if (type === 'ordering') {
    updates.ordering_score = score;
    const { data: existing } = await supabase
      .from('student_textbook_progress')
      .select('ordering_attempts')
      .eq('student_id', user.id)
      .eq('passage_id', passageId)
      .single();
    updates.ordering_attempts = (existing?.ordering_attempts || 0) + 1;
  } else if (type === 'translation') {
    updates.translation_score = score;
    const { data: existing } = await supabase
      .from('student_textbook_progress')
      .select('translation_attempts')
      .eq('student_id', user.id)
      .eq('passage_id', passageId)
      .single();
    updates.translation_attempts = (existing?.translation_attempts || 0) + 1;
  }

  const { error } = await supabase
    .from('student_textbook_progress')
    .upsert(updates, {
      onConflict: 'student_id,passage_id',
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
