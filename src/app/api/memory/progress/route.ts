import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateNextReview } from '@/lib/memory/spaced-repetition';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { memoryItemId, testType, isCorrect } = body as {
    memoryItemId: string;
    testType: 'flashcard' | 'quiz' | 'spelling';
    isCorrect: boolean;
  };

  if (!memoryItemId || !testType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Get or create progress
  const { data: existing } = await supabase
    .from('student_memory_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('memory_item_id', memoryItemId)
    .single();

  const currentRepetition = existing?.repetition_count || 0;
  const result = calculateNextReview(currentRepetition, isCorrect);

  // Build update object based on test type
  const updates: Record<string, unknown> = {
    student_id: user.id,
    memory_item_id: memoryItemId,
    repetition_count: result.newRepetitionCount,
    current_interval_days: result.nextIntervalDays,
    next_review_date: result.nextReviewDate,
    is_mastered: result.isMastered,
  };

  if (testType === 'flashcard') {
    updates.flashcard_seen = true;
  } else if (testType === 'quiz') {
    if (isCorrect) {
      updates.quiz_correct_count = (existing?.quiz_correct_count || 0) + 1;
    } else {
      updates.quiz_wrong_count = (existing?.quiz_wrong_count || 0) + 1;
    }
  } else if (testType === 'spelling') {
    if (isCorrect) {
      updates.spelling_correct_count = (existing?.spelling_correct_count || 0) + 1;
    } else {
      updates.spelling_wrong_count = (existing?.spelling_wrong_count || 0) + 1;
    }
  }

  const { error } = await supabase
    .from('student_memory_progress')
    .upsert(updates, {
      onConflict: 'student_id,memory_item_id',
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...result });
}
