import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { vocabProgressSchema } from '@/lib/api/schemas';

const PASS_THRESHOLD = 80;

export const POST = createApiHandler(
  { schema: vocabProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, type, score, totalItems } = body;

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

    // Check if vocab stage should be completed (quiz 80+ AND spelling 80+)
    const quizScore = type === 'quiz' ? score : (existing?.vocab_quiz_score ?? 0);
    const spellingScore = type === 'spelling' ? score : (existing?.vocab_spelling_score ?? 0);

    const vocabCompleted =
      (quizScore ?? 0) >= PASS_THRESHOLD &&
      (spellingScore ?? 0) >= PASS_THRESHOLD;

    updates.vocab_completed = vocabCompleted;

    const { error } = await supabase
      .from('naesin_student_progress')
      .upsert(updates, { onConflict: 'student_id,unit_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, vocabCompleted });
  }
);
