import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';

// 현재 주 월요일 (UTC 기준)
function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

// 3주 전 월요일
function getThreeWeeksAgo(mondayStr: string): string {
  const d = new Date(mondayStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 14);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(from: string, to: string): string {
  const f = new Date(from + 'T00:00:00Z');
  const t = new Date(to + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + 6); // Sunday
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fmt(f)} ~ ${fmt(t)}`;
}

// GET: 오답 목록 + 진행 상태
export const GET = createApiHandler(
  { hasBody: false },
  async ({ user, supabase }) => {
    const weekStart = getCurrentMonday();
    const windowStart = getThreeWeeksAgo(weekStart);

    // 오답 = 퀴즈(시험)에서 틀린 단어만. 매칭/스펠링은 자가수정 연습이라 제외.
    const { data: quizRows } = await supabase
      .from('voca_quiz_results')
      .select('wrong_words, day_id')
      .eq('student_id', user.id)
      .gte('created_at', windowStart + 'T00:00:00Z');

    // 단어별 중복 제거 (lowercase front_text)
    const wordMap = new Map<string, { front_text: string; back_text: string }>();
    const dayIds = new Set<string>();

    for (const row of quizRows || []) {
      if (row.day_id) dayIds.add(row.day_id);
      for (const w of (row.wrong_words || []) as Array<{ front_text: string; back_text: string }>) {
        const key = w.front_text.toLowerCase();
        if (!wordMap.has(key)) wordMap.set(key, { front_text: w.front_text, back_text: w.back_text });
      }
    }

    const words = Array.from(wordMap.values());

    // 4. Load existing progress for this week
    const { data: review } = await supabase
      .from('voca_wrong_review')
      .select('progress, completed_at')
      .eq('student_id', user.id)
      .eq('week_start', weekStart)
      .single();

    const progress: Record<string, number> = (review?.progress as Record<string, number>) || {};

    // 5. Distractor pool: back_text from related days' vocabulary
    let distractorPool: string[] = [];
    if (dayIds.size > 0) {
      const { data: vocabRows } = await supabase
        .from('voca_vocabulary')
        .select('back_text')
        .in('day_id', [...dayIds]);
      distractorPool = (vocabRows || []).map((v) => v.back_text);
    }

    return NextResponse.json({
      words,
      progress,
      completedAt: review?.completed_at || null,
      weekLabel: formatWeekLabel(windowStart, weekStart),
      weekStart,
      distractorPool,
    });
  },
);

const patchSchema = z.object({
  progress: z.record(z.string(), z.number()),
});

// PATCH: 진행 상태 저장
export const PATCH = createApiHandler(
  { schema: patchSchema },
  async ({ user, body, supabase }) => {
    const weekStart = getCurrentMonday();
    const { progress } = body;

    const totalWords = Object.keys(progress).length;
    const graduatedCount = Object.values(progress).filter((v) => v >= 3).length;
    const completedAt = totalWords > 0 && graduatedCount >= totalWords ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('voca_wrong_review')
      .upsert(
        {
          student_id: user.id,
          week_start: weekStart,
          total_words: totalWords,
          graduated_count: graduatedCount,
          progress,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,week_start' },
      )
      .select('id, completed_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, completedAt: data.completed_at });
  },
);
