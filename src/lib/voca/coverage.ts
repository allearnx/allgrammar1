import type { SupabaseClient } from '@supabase/supabase-js';
import { isR1Complete } from '@/lib/dashboard/voca-helpers';
import { fetchWrongPool, activeWrongKeys } from '@/lib/voca/wrong-pool';

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

  const { data: targetWords } = await client
    .from('voca_vocabulary')
    .select('front_text')
    .in('day_id', targetDayIds);
  const target = new Set((targetWords ?? []).map((w) => norm(w.front_text)));
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

  // 3. 아는 단어 = 완료 Day 단어 − 정복 대기 오답
  const { data: knownWords } = await client
    .from('voca_vocabulary')
    .select('front_text')
    .in('day_id', doneDayIds);
  const studied = new Set((knownWords ?? []).map((w) => norm(w.front_text)));
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
