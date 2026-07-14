import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import { fetchWrongPool, activeWrongKeys, getCurrentMonday } from '@/lib/voca/wrong-pool';
import { computeVocaCoverage } from '@/lib/voca/coverage';

function formatWeekLabel(from: string, to: string): string {
  const f = new Date(from + 'T00:00:00Z');
  const t = new Date(to + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + 6); // Sunday
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fmt(f)} ~ ${fmt(t)}`;
}

// GET: 오답 목록 + 진행 상태 + 문맥 문제 재료 + 커버리지 델타
export const GET = createApiHandler(
  { hasBody: false },
  async ({ user, supabase }) => {
    const pool = await fetchWrongPool(supabase, user.id);
    const words = Array.from(pool.wordMap.values());

    // 보기 풀 + 문맥형(빈칸 문장) 재료: 오답이 나온 Day들의 단어
    let distractorPool: string[] = [];
    let wordDistractorPool: string[] = [];
    // 뜻 겹침 필터용 — 단어→뜻 쌍 (유의어가 보기로 섞여 정답이 두 개가 되는 것 방지)
    let poolWords: { front_text: string; back_text: string }[] = [];
    const exampleMap: Record<string, string> = {};
    const examSourceMap: Record<string, string> = {};
    if (pool.dayIds.size > 0) {
      const { data: vocabRows } = await supabase
        .from('voca_vocabulary')
        .select('front_text, back_text, example_sentence, exam_source')
        .in('day_id', [...pool.dayIds]);
      distractorPool = (vocabRows || []).map((v) => v.back_text);
      wordDistractorPool = (vocabRows || []).map((v) => v.front_text);
      poolWords = (vocabRows || []).map((v) => ({ front_text: v.front_text, back_text: v.back_text }));
      for (const v of vocabRows || []) {
        const key = v.front_text.toLowerCase();
        if (v.example_sentence && pool.wordMap.has(key) && !exampleMap[key]) {
          exampleMap[key] = v.example_sentence;
          if (v.exam_source) examSourceMap[key] = v.exam_source;
        }
      }
    }

    // 커버리지 델타: 최근 공부한 교재 기준 "다 정복하면 +X%p"
    let coverageDelta: { bookTitle: string; now: number; after: number } | null = null;
    if (activeWrongKeys(pool).size > 0) {
      const { data: recentProg } = await supabase
        .from('voca_student_progress')
        .select('day_id')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recentProg?.day_id) {
        const { data: recentDay } = await supabase
          .from('voca_days')
          .select('book_id, book:voca_books(title)')
          .eq('id', recentProg.day_id)
          .single();
        if (recentDay?.book_id) {
          const cov = await computeVocaCoverage(supabase, user.id, recentDay.book_id);
          if (cov.coverage !== null && cov.coverageAfterConquest !== null && cov.coverageAfterConquest > cov.coverage) {
            const bookRel = recentDay.book as unknown as { title: string } | { title: string }[] | null;
            const bookTitle = Array.isArray(bookRel) ? (bookRel[0]?.title ?? '현재 교재') : (bookRel?.title ?? '현재 교재');
            coverageDelta = { bookTitle, now: cov.coverage, after: cov.coverageAfterConquest };
          }
        }
      }
    }

    return NextResponse.json({
      words,
      progress: pool.progress,
      completedAt: pool.completedAt,
      weekLabel: formatWeekLabel(pool.windowStart, pool.weekStart),
      weekStart: pool.weekStart,
      distractorPool,
      wordDistractorPool,
      poolWords,
      exampleMap,
      examSourceMap,
      coverageDelta,
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
