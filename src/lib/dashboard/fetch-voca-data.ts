import type { SupabaseClient } from '@supabase/supabase-js';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';
import { VOCA_BOOKS_COLUMNS, VOCA_DAYS_COLUMNS, VOCA_STUDENT_PROGRESS_COLUMNS } from '@/types/voca';
import { isR1Complete, isR2Complete } from '@/lib/dashboard/voca-helpers';

export interface VocaDashboardData {
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  wordCount: number;
  wrongWordCounts: Record<string, number>;
  quizHistory: { date: string; score: number }[];
  submissionStatuses: Record<string, string>;
  /** 선생님이 교재를 고정 배정했는지 (미배정+진도0 → 교재 선택 가이드로) */
  hasBookAssignment: boolean;
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
    ? await supabase.from('voca_books').select(VOCA_BOOKS_COLUMNS).eq('id', bookAssignment.book_id)
    : await supabase.from('voca_books').select(VOCA_BOOKS_COLUMNS).eq('is_active', true).order('created_at');
  let books: VocaBook[] = (booksData as VocaBook[]) || [];

  // 2. Days
  const bookIds = books.map((b) => b.id);
  let days: VocaDay[] = [];
  if (bookIds.length > 0) {
    const { data } = await supabase
      .from('voca_days')
      .select(VOCA_DAYS_COLUMNS)
      .in('book_id', bookIds)
      .order('sort_order');
    days = data || [];
  }

  // 3. Progress
  // ⚠️ `.in('day_id', …)` 금지 — 전체 활성 Day(655개)로는 요청 URL 한계(~300개)를 넘어
  // 쿼리가 죽는다 (2026-08-06). 학생 스코프 조회 후 JS에서 활성 Day로 거른다.
  let progressList: VocaStudentProgress[] = [];
  if (days.length > 0) {
    const activeDayIdSet = new Set(days.map((d) => d.id));
    const { data } = await supabase
      .from('voca_student_progress')
      .select(VOCA_STUDENT_PROGRESS_COLUMNS)
      .eq('student_id', userId);
    progressList = (data || []).filter((p) => activeDayIdSet.has(p.day_id));
  }

  // 3-1. 교재 미배정(개인) 학생: 가장 최근 학습한 교재로 대시보드 범위 한정.
  // (미배정이면 전 교재의 Day가 한 덩어리로 섞여 현재 Day·진행률·통계가 엉킨다)
  if (!bookAssignment && progressList.length > 0) {
    const dayBookMap = new Map(days.map((d) => [d.id, d.book_id]));
    const recent = [...progressList].sort(
      (a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''),
    )[0];
    const recentBookId = dayBookMap.get(recent.day_id);
    if (recentBookId) {
      books = books.filter((b) => b.id === recentBookId);
      days = days.filter((d) => d.book_id === recentBookId);
      const scopedDayIds = new Set(days.map((d) => d.id));
      progressList = progressList.filter((p) => scopedDayIds.has(p.day_id));
    }
  }

  const dayIds = days.map((d) => d.id);

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

  // 5. Wrong words + quiz history — dayIds가 미배정 학생은 교재 1권, 배정 학생은 전체
  // 활성 Day(655개)라 `.in()` URL 한계에 걸린다 → 학생 스코프 조회 후 JS 필터
  const dayIdSet = new Set(dayIds);
  const [quizResultsAll, matchingSubAll, quizHistoryAll] = await Promise.all([
    dayIds.length > 0
      ? supabase.from('voca_quiz_results').select('day_id, wrong_words').eq('student_id', userId)
      : Promise.resolve({ data: null }),
    dayIds.length > 0
      ? supabase.from('voca_matching_submissions').select('day_id, status, wrong_words').eq('student_id', userId)
      : Promise.resolve({ data: null }),
    dayIds.length > 0
      ? supabase.from('voca_quiz_results').select('day_id, score, created_at').eq('student_id', userId).order('created_at', { ascending: false }).limit(200)
      : Promise.resolve({ data: null }),
  ]);
  const quizResultsRes = { data: (quizResultsAll.data || []).filter((r: { day_id: string }) => dayIdSet.has(r.day_id)) };
  const matchingSubRes = { data: (matchingSubAll.data || []).filter((r: { day_id: string }) => dayIdSet.has(r.day_id)) };
  const quizHistoryRes = {
    data: (quizHistoryAll.data || []).filter((r: { day_id: string }) => dayIdSet.has(r.day_id)).slice(0, 20),
  };

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

  return { books, days, progressList, wordCount, wrongWordCounts, quizHistory, submissionStatuses, hasBookAssignment: !!bookAssignment };
}
