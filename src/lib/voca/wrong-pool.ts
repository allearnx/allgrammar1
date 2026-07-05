import type { SupabaseClient } from '@supabase/supabase-js';

/** 올킬오답 정복 졸업 기준 (연속 정답 횟수) */
export const WRONG_GRADUATE_THRESHOLD = 3;

/** 현재 주 월요일 (UTC 기준) */
export function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

/** 3주 롤링 윈도우 시작일 */
export function getThreeWeeksAgo(mondayStr: string): string {
  const d = new Date(mondayStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 14);
  return d.toISOString().slice(0, 10);
}

export interface WrongPool {
  /** lowercase front_text → 단어 (중복 제거) */
  wordMap: Map<string, { front_text: string; back_text: string }>;
  /** 이번 주 정복 진행 (lowercase front_text → 연속 정답 수) */
  progress: Record<string, number>;
  completedAt: string | null;
  weekStart: string;
  windowStart: string;
  /** 오답이 나온 Day id들 (보기 풀 구성용) */
  dayIds: Set<string>;
}

/**
 * 올킬오답 풀 — 최근 3주 퀴즈 오답 + 이번 주 정복 진행.
 * 오답 수집 범위는 퀴즈만 (스펠링·매칭은 자가수정 연습이라 제외 — 학부모 노출 최소화 정책).
 */
export async function fetchWrongPool(client: SupabaseClient, studentId: string): Promise<WrongPool> {
  const weekStart = getCurrentMonday();
  const windowStart = getThreeWeeksAgo(weekStart);

  const [{ data: quizRows }, { data: review }] = await Promise.all([
    client
      .from('voca_quiz_results')
      .select('wrong_words, day_id')
      .eq('student_id', studentId)
      .gte('created_at', windowStart + 'T00:00:00Z'),
    client
      .from('voca_wrong_review')
      .select('progress, completed_at')
      .eq('student_id', studentId)
      .eq('week_start', weekStart)
      .maybeSingle(),
  ]);

  const wordMap = new Map<string, { front_text: string; back_text: string }>();
  const dayIds = new Set<string>();
  for (const row of quizRows || []) {
    if (row.day_id) dayIds.add(row.day_id);
    for (const w of (row.wrong_words || []) as Array<{ front_text: string; back_text: string }>) {
      const key = w.front_text.toLowerCase();
      if (!wordMap.has(key)) wordMap.set(key, { front_text: w.front_text, back_text: w.back_text });
    }
  }

  return {
    wordMap,
    progress: (review?.progress as Record<string, number>) || {},
    completedAt: review?.completed_at || null,
    weekStart,
    windowStart,
    dayIds,
  };
}

/** 아직 정복 못 한 오답 키 (lowercase) */
export function activeWrongKeys(pool: WrongPool): Set<string> {
  const active = new Set<string>();
  for (const key of pool.wordMap.keys()) {
    if ((pool.progress[key] ?? 0) < WRONG_GRADUATE_THRESHOLD) active.add(key);
  }
  return active;
}
