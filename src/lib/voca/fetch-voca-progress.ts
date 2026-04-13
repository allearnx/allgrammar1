import { createAdminClient } from '@/lib/supabase/admin';
import type { VocaProgressRow } from '@/types/voca';

/** Fetch voca day-level progress with book JOIN for a student. */
export async function fetchVocaProgress(studentId: string): Promise<VocaProgressRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('voca_student_progress')
    .select('day_id, flashcard_completed, quiz_score, spelling_score, matching_score, matching_completed, round2_flashcard_completed, round2_quiz_score, round2_matching_score, round2_matching_completed, updated_at, day:voca_days(id, day_number, title, book:voca_books(id, title, sort_order))')
    .eq('student_id', studentId)
    .returns<VocaProgressRow[]>();
  return data || [];
}
