import type { SupabaseClient } from '@supabase/supabase-js';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

export interface VocaDashboardData {
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  wordCount: number;
  wrongWordCounts: Record<string, number>;
  quizHistory: { date: string; score: number }[];
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
    : await supabase.from('voca_books').select('*').order('created_at');
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
  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);
  const progressMap = new Map(progressList.map((p) => [p.day_id, p]));
  const currentDay = sortedDays.find((d) => {
    const p = progressMap.get(d.id);
    if (!p) return true;
    const quizPass = (p.quiz_score ?? 0) >= 80;
    const r1 = (p.flashcard_completed || quizPass) && quizPass && (p.spelling_score ?? 0) >= 80 && p.matching_completed;
    const r2 = p.round2_flashcard_completed && (p.round2_quiz_score ?? 0) >= 80 && p.round2_matching_completed;
    return !r1 || !r2;
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
      ? supabase.from('voca_matching_submissions').select('wrong_words').eq('student_id', userId).in('day_id', dayIds)
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
  for (const row of matchingSubRes.data || []) {
    for (const w of (row.wrong_words as { word: string }[]) || []) {
      wrongWordCounts[w.word] = (wrongWordCounts[w.word] || 0) + 1;
    }
  }

  const quizHistory = (quizHistoryRes.data || []).reverse().map((r: { score: number; created_at: string }) => ({
    date: r.created_at.slice(0, 10),
    score: r.score,
  }));

  return { books, days, progressList, wordCount, wrongWordCounts, quizHistory };
}
