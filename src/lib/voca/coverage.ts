import type { SupabaseClient } from '@supabase/supabase-js';
import { isR1Complete } from '@/lib/dashboard/voca-helpers';
import { selectInChunks } from '@/lib/supabase/in-chunks';
import { fetchWrongPool, activeWrongKeys, getCurrentMonday } from '@/lib/voca/wrong-pool';

export interface VocaCoverage {
  /** 0~100. 대상 교재에 단어가 없으면 null */
  coverage: number | null;
  /** 대상 교재 단어 중 학생이 아는 단어 수 */
  knownInBook: number;
  /** 대상 교재의 고유 단어 수 */
  totalWords: number;
  /** 현재 정복 대기 중인 오답을 모두 졸업시켰을 때의 커버리지 (0~100) */
  coverageAfterConquest: number | null;
}

/**
 * 시험 커버리지 — "이 교재(시험) 단어가 지금 몇 % 읽히는가".
 *
 * 아는 단어 = (어느 교재에서든) 1회독 완료한 Day의 단어 − 아직 정복 못 한 오답.
 * - 다른 교재에서 외운 단어도 이 교재에 나오면 반영 ("진도율"이 아니라 "읽히는 정도")
 * - 정복 대기 오답은 제외 → 올킬오답에서 졸업시키면 커버리지가 실제로 오른다
 * - 저장하지 않고 매번 계산 → 교재 단어 추가(4개년→5개년) 시 자동 재계산
 */
export async function computeVocaCoverage(
  client: SupabaseClient,
  studentId: string,
  bookId: string,
): Promise<VocaCoverage> {
  const norm = (w: string) => w.trim().toLowerCase();

  // 1. 대상 교재의 고유 단어 집합
  const { data: targetDays } = await client
    .from('voca_days')
    .select('id')
    .eq('book_id', bookId);
  const targetDayIds = (targetDays ?? []).map((d) => d.id);
  if (targetDayIds.length === 0) return { coverage: null, knownInBook: 0, totalWords: 0, coverageAfterConquest: null };

  const targetWords = await selectInChunks<{ front_text: string }>(targetDayIds, (chunk) =>
    client.from('voca_vocabulary').select('front_text').in('day_id', chunk),
  );
  const target = new Set(targetWords.map((w) => norm(w.front_text)));
  if (target.size === 0) return { coverage: null, knownInBook: 0, totalWords: 0, coverageAfterConquest: null };

  // 2. 학생이 1회독 완료한 Day (모든 교재) + 정복 대기 오답
  const [{ data: progress }, wrongPool] = await Promise.all([
    client
      .from('voca_student_progress')
      .select('day_id, flashcard_completed, quiz_score, spelling_score, matching_completed')
      .eq('student_id', studentId),
    fetchWrongPool(client, studentId),
  ]);
  const doneDayIds = (progress ?? []).filter((p) => isR1Complete(p)).map((p) => p.day_id);
  if (doneDayIds.length === 0) return { coverage: 0, knownInBook: 0, totalWords: target.size, coverageAfterConquest: 0 };

  // 3. 아는 단어 = 완료 Day 단어 − 정복 대기 오답 (완료 Day가 많은 학생은 id 목록이 길어 청크 필수)
  const knownWords = await selectInChunks<{ front_text: string }>(doneDayIds, (chunk) =>
    client.from('voca_vocabulary').select('front_text').in('day_id', chunk),
  );
  const studied = new Set(knownWords.map((w) => norm(w.front_text)));
  const activeWrong = activeWrongKeys(wrongPool);

  let hit = 0;
  let hitAfter = 0;
  for (const w of target) {
    if (studied.has(w)) {
      hitAfter++; // 오답을 다 정복하면 아는 단어로 복귀
      if (!activeWrong.has(w)) hit++;
    }
  }

  return {
    coverage: Math.round((hit / target.size) * 100),
    knownInBook: hit,
    totalWords: target.size,
    coverageAfterConquest: Math.round((hitAfter / target.size) * 100),
  };
}

export interface VocaTotalKnown {
  /** 누적 암기 단어 수 (교재 무관 고유 단어, 정복 대기 오답 제외) */
  knownWords: number;
  /** 이번 주(월요일~)에 새로 외운 단어 수 */
  weeklyNew: number;
}

/**
 * 누적 암기 단어 — "지금까지 외운 단어 N개" (교재 횡단 대표 숫자, 학부모 리포트용).
 * 아는 단어 = (모든 교재에서) 1회독 완료한 Day의 고유 단어 − 정복 대기 오답.
 * 이번 주 증가분 = 이번 주에 완료(updated_at 기준 근사)한 Day에서 처음 나온 단어.
 */
export async function computeTotalKnownWords(
  client: SupabaseClient,
  studentId: string,
): Promise<VocaTotalKnown> {
  const norm = (w: string) => w.trim().toLowerCase();
  const weekStartIso = getCurrentMonday() + 'T00:00:00Z';

  const [{ data: progress }, wrongPool] = await Promise.all([
    client
      .from('voca_student_progress')
      .select('day_id, flashcard_completed, quiz_score, spelling_score, matching_completed, updated_at')
      .eq('student_id', studentId),
    fetchWrongPool(client, studentId),
  ]);
  const doneRows = (progress ?? []).filter((p) => isR1Complete(p));
  if (doneRows.length === 0) return { knownWords: 0, weeklyNew: 0 };

  const words = await selectInChunks<{ front_text: string; day_id: string }>(
    doneRows.map((p) => p.day_id),
    (chunk) => client.from('voca_vocabulary').select('front_text, day_id').in('day_id', chunk),
  );

  const thisWeekDayIds = new Set(
    doneRows.filter((p) => p.updated_at && p.updated_at >= weekStartIso).map((p) => p.day_id),
  );
  const activeWrong = activeWrongKeys(wrongPool);

  const known = new Set<string>();
  const beforeWeek = new Set<string>();
  for (const w of words ?? []) {
    const key = norm(w.front_text);
    if (!activeWrong.has(key)) known.add(key);
    if (!thisWeekDayIds.has(w.day_id)) beforeWeek.add(key);
  }
  let weeklyNew = 0;
  for (const w of words ?? []) {
    const key = norm(w.front_text);
    if (thisWeekDayIds.has(w.day_id) && !beforeWeek.has(key) && known.has(key)) {
      weeklyNew++;
      beforeWeek.add(key); // 같은 단어 중복 카운트 방지
    }
  }

  return { knownWords: known.size, weeklyNew };
}
