import type { SupabaseClient } from '@supabase/supabase-js';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';
import { isR1Complete, isR2Complete } from '@/lib/dashboard/voca-helpers';

export interface VocaDashboardData {
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  wordCount: number;
  wrongWordCounts: Record<string, number>;
  quizHistory: { date: string; score: number }[];
  submissionStatuses: Record<string, string>;
}

export async function fetchVocaDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<VocaDashboardData> {
  // 1. Book assignment → books
  const { data: bookAssignment } = await supabase
    .from('voca_book_assignments')
    .select('book_id')
    .eq('student_id', userId)
    .single();

  const { data: booksData } = bookAssignment
    ? await supabase.from('voca_books').select('*').eq('id', bookAssignment.book_id)
    : await supabase.from('voca_books').select('*').eq('is_active', true).order('created_at');
  const books: VocaBook[] = (booksData as VocaBook[]) || [];

  // 2. Days
  const bookIds = books.map((b) => b.id);
  let days: VocaDay[] = [];
  if (bookIds.length > 0) {
    const { data } = await supabase
      .from('voca_days')
      .select('*')
      .in('book_id', bookIds)
      .order('sort_order');
    days = data || [];
  }

  // 3. Progress
  const dayIds = days.map((d) => d.id);
  let progressList: VocaStudentProgress[] = [];
  if (dayIds.length > 0) {
    const { data } = await supabase
      .from('voca_student_progress')
      .select('*')
      .eq('student_id', userId)
      .in('day_id', dayIds);
    progressList = data || [];
  }

  // 4. Word count for current active day
  // 책 단위 회독: 모든 Day 1회독 완료 → 2회독 모드
  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);
  const progressMap = new Map(progressList.map((p) => [p.day_id, p]));
  const allRound1Done = sortedDays.length > 0 && sortedDays.every((d) => {
    return isR1Complete(progressMap.get(d.id) ?? null);
  });
  // 가장 최근 학습한 Day 우선
  const recentDay = sortedDays
    .filter((d) => progressMap.has(d.id))
    .sort((a, b) => (progressMap.get(b.id)!.updated_at ?? '').localeCompare(progressMap.get(a.id)!.updated_at ?? ''))[0];
  const isRecentIncomplete = recentDay && (
    allRound1Done
      ? !isR2Complete(progressMap.get(recentDay.id) ?? null)
      : !isR1Complete(progressMap.get(recentDay.id) ?? null)
  );
  const currentDay = (recentDay && isRecentIncomplete) ? recentDay : sortedDays.find((d) => {
    const p = progressMap.get(d.id) ?? null;
    if (allRound1Done) return !isR2Complete(p);
    return !isR1Complete(p);
  }) ?? sortedDays[0];

  let wordCount = 0;
  if (currentDay) {
    const { count } = await supabase
      .from('voca_vocabulary')
      .select('id', { count: 'exact', head: true })
      .eq('day_id', currentDay.id);
    wordCount = count || 0;
  }

  // 5. Wrong words + quiz history
  const [quizResultsRes, matchingSubRes, quizHistoryRes] = await Promise.all([
    dayIds.length > 0
      ? supabase.from('voca_quiz_results').select('wrong_words').eq('student_id', userId).in('day_id', dayIds)
      : Promise.resolve({ data: null }),
    dayIds.length > 0
      ? supabase.from('voca_matching_submissions').select('day_id, status, wrong_words').eq('student_id', userId).in('day_id', dayIds)
      : Promise.resolve({ data: null }),
    dayIds.length > 0
      ? supabase.from('voca_quiz_results').select('score, created_at').eq('student_id', userId).in('day_id', dayIds).order('created_at', { ascending: false }).limit(20)
      : Promise.resolve({ data: null }),
  ]);

  const wrongWordCounts: Record<string, number> = {};
  for (const row of quizResultsRes.data || []) {
    for (const w of (row.wrong_words as { front_text: string }[]) || []) {
      wrongWordCounts[w.front_text] = (wrongWordCounts[w.front_text] || 0) + 1;
    }
  }
  const submissionStatuses: Record<string, string> = {};
  for (const row of matchingSubRes.data || []) {
    if (row.day_id && row.status) submissionStatuses[row.day_id] = row.status;
    for (const w of (row.wrong_words as { word: string }[]) || []) {
      wrongWordCounts[w.word] = (wrongWordCounts[w.word] || 0) + 1;
    }
  }

  const quizHistory = (quizHistoryRes.data || []).reverse().map((r: { score: number; created_at: string }) => ({
    date: r.created_at.slice(0, 10),
    score: r.score,
  }));

  return { books, days, progressList, wordCount, wrongWordCounts, quizHistory, submissionStatuses };
}
