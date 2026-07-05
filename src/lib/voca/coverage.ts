import type { SupabaseClient } from '@supabase/supabase-js';
import { isR1Complete } from '@/lib/dashboard/voca-helpers';

export interface VocaCoverage {
  /** 0~100. 대상 교재에 단어가 없으면 null */
  coverage: number | null;
  /** 대상 교재 단어 중 학생이 아는 단어 수 */
  knownInBook: number;
  /** 대상 교재의 고유 단어 수 */
  totalWords: number;
}

/**
 * 시험 커버리지 — "이 교재(시험) 단어가 지금 몇 % 읽히는가".
 *
 * 아는 단어 = 학생이 (어느 교재에서든) 1회독 완료한 Day에 포함된 단어 전체.
 * 다른 교재에서 외운 단어도 이 교재에 나오면 커버리지에 반영된다 —
 * "이 교재 진도율"이 아니라 "시험지가 읽히는 정도"를 재는 지표.
 *
 * 저장하지 않고 매번 계산하므로, 교재에 단어가 추가되면(예: 4개년→5개년)
 * 다음 조회 때 자동으로 재계산된다.
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
  if (targetDayIds.length === 0) return { coverage: null, knownInBook: 0, totalWords: 0 };

  const { data: targetWords } = await client
    .from('voca_vocabulary')
    .select('front_text')
    .in('day_id', targetDayIds);
  const target = new Set((targetWords ?? []).map((w) => norm(w.front_text)));
  if (target.size === 0) return { coverage: null, knownInBook: 0, totalWords: 0 };

  // 2. 학생이 1회독 완료한 Day (모든 교재)
  const { data: progress } = await client
    .from('voca_student_progress')
    .select('day_id, flashcard_completed, quiz_score, spelling_score, matching_completed')
    .eq('student_id', studentId);
  const doneDayIds = (progress ?? []).filter((p) => isR1Complete(p)).map((p) => p.day_id);
  if (doneDayIds.length === 0) return { coverage: 0, knownInBook: 0, totalWords: target.size };

  // 3. 아는 단어 집합 → 교집합
  const { data: knownWords } = await client
    .from('voca_vocabulary')
    .select('front_text')
    .in('day_id', doneDayIds);
  const known = new Set((knownWords ?? []).map((w) => norm(w.front_text)));

  let hit = 0;
  for (const w of target) if (known.has(w)) hit++;

  return {
    coverage: Math.round((hit / target.size) * 100),
    knownInBook: hit,
    totalWords: target.size,
  };
}
