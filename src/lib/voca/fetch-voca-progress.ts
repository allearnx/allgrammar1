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

/**
 * 진도 행에 등장하는 교재들의 전체 Day 수.
 * "완료 Day 0/N"의 분모용 — 진도 행 수(시작한 Day)만 세면 교재 전체 분량이 안 보인다.
 */
export async function fetchBookDayTotals(vocaProgress: VocaProgressRow[]): Promise<Record<string, number>> {
  const bookIds = [...new Set(vocaProgress.map((vp) => vp.day?.book?.id).filter((id): id is string => !!id))];
  if (bookIds.length === 0) return {};
  const admin = createAdminClient();
  const { data } = await admin.from('voca_days').select('id, book_id').in('book_id', bookIds);
  const totals: Record<string, number> = {};
  for (const d of data ?? []) totals[d.book_id] = (totals[d.book_id] ?? 0) + 1;
  return totals;
}
