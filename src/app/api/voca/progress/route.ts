import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaProgressSaveSchema } from '@/lib/api/schemas';

// POST — 학생 진도 저장
export const POST = createApiHandler(
  { schema: vocaProgressSaveSchema },
  async ({ user, body, supabase }) => {
    const { dayId, type, score, matchingAttempt, round } = body;
    const isRound2 = round === '2';

    // Build update object based on type
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    switch (type) {
      case 'flashcard':
        updates[isRound2 ? 'round2_flashcard_completed' : 'flashcard_completed'] = true;
        break;
      case 'quiz':
        updates[isRound2 ? 'round2_quiz_score' : 'quiz_score'] = score;
        break;
      case 'spelling':
        updates.spelling_score = score;
        break;
      case 'matching':
        if (isRound2) {
          updates.round2_matching_score = score;
          updates.round2_matching_attempt = matchingAttempt || 1;
          if (score != null && score >= 90) {
            updates.round2_matching_completed = true;
          }
        } else {
          updates.matching_score = score;
          updates.matching_attempt = matchingAttempt || 1;
          if (score != null && score >= 90) {
            updates.matching_completed = true;
          }
        }
        break;
    }

    const { data, error } = await supabase
      .from('voca_student_progress')
      .upsert(
        { student_id: user.id, day_id: dayId, ...updates },
        { onConflict: 'student_id,day_id' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, progress: data });
  }
);
