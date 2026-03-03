import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PASS_THRESHOLD = 80;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { unitId, type, score, totalItems } = await request.json();
  if (!unitId || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Get or create progress
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

  if (type === 'flashcard') {
    updates.vocab_flashcard_count = totalItems || (existing?.vocab_flashcard_count ?? 0);
  } else if (type === 'quiz') {
    updates.vocab_quiz_score = score;
  } else if (type === 'spelling') {
    updates.vocab_spelling_score = score;
  }

  // Check if vocab stage should be completed
  const flashcardCount = type === 'flashcard' ? (totalItems || 0) : (existing?.vocab_flashcard_count ?? 0);
  const quizScore = type === 'quiz' ? score : (existing?.vocab_quiz_score ?? 0);
  const spellingScore = type === 'spelling' ? score : (existing?.vocab_spelling_score ?? 0);

  // Get total vocabulary count for this unit
  const { count: vocabCount } = await supabase
    .from('naesin_vocabulary')
    .select('*', { count: 'exact', head: true })
    .eq('unit_id', unitId);

  const vocabCompleted =
    flashcardCount >= (vocabCount || 0) &&
    quizScore >= PASS_THRESHOLD &&
    spellingScore >= PASS_THRESHOLD;

  updates.vocab_completed = vocabCompleted;

  const { error } = await supabase
    .from('naesin_student_progress')
    .upsert(updates, { onConflict: 'student_id,unit_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, vocabCompleted });
}
