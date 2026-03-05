import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PASS_THRESHOLD = 80;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { unitId, type, score } = await request.json();
  if (!unitId || !type || score === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

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

  if (type === 'fill_blanks') {
    const currentBest = existing?.passage_fill_blanks_best ?? 0;
    updates.passage_fill_blanks_best = Math.max(currentBest, score);
  } else if (type === 'ordering') {
    const currentBest = existing?.passage_ordering_best ?? 0;
    updates.passage_ordering_best = Math.max(currentBest, score);
  } else if (type === 'translation') {
    const currentBest = existing?.passage_translation_best ?? 0;
    updates.passage_translation_best = Math.max(currentBest, score);
  }

  const fillScore = type === 'fill_blanks'
    ? Math.max(existing?.passage_fill_blanks_best ?? 0, score)
    : (existing?.passage_fill_blanks_best ?? 0);
  const translationScore = type === 'translation'
    ? Math.max(existing?.passage_translation_best ?? 0, score)
    : (existing?.passage_translation_best ?? 0);

  // Completion: fill_blanks 80% + translation 80%
  const passageCompleted = fillScore >= PASS_THRESHOLD && translationScore >= PASS_THRESHOLD;
  updates.passage_completed = passageCompleted;

  const { error } = await supabase
    .from('naesin_student_progress')
    .upsert(updates, { onConflict: 'student_id,unit_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, passageCompleted });
}
