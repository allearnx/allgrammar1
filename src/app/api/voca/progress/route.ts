import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaProgressSaveSchema } from '@/lib/api/schemas';
import { buildVocaQuizUpdate, buildVocaSpellingUpdate } from '@/lib/progress-helpers';
import { VOCA_STUDENT_PROGRESS_COLUMNS } from '@/types/voca';

// POST — 학생 진도 저장
export const POST = createApiHandler(
  { schema: vocaProgressSaveSchema },
  async ({ user, body, supabase }) => {
    const { dayId, type, score, matchingAttempt, round, spellingWrongWords } = body;
    const isRound2 = round === '2';

    // Fetch existing progress for best-score logic
    const { data: existing } = await supabase
      .from('voca_student_progress')
      .select(VOCA_STUDENT_PROGRESS_COLUMNS)
      .eq('student_id', user.id)
      .eq('day_id', dayId)
      .single();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    switch (type) {
      case 'flashcard':
        updates[isRound2 ? 'round2_flashcard_completed' : 'flashcard_completed'] = true;
        break;
      case 'quiz':
        Object.assign(updates, buildVocaQuizUpdate(score ?? 0, isRound2, existing));
        break;
      case 'spelling':
        Object.assign(updates, buildVocaSpellingUpdate(score ?? 0, existing));
        if (spellingWrongWords) {
          updates.spelling_wrong_words = spellingWrongWords;
        }
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

    // Log every attempt for history tracking (fire-and-forget)
    await supabase.from('voca_attempt_log').insert({
      student_id: user.id, day_id: dayId, step: type, score: score ?? null,
    });

    return NextResponse.json({ success: true, progress: data });
  }
);
