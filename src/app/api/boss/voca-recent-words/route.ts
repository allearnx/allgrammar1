import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * boss 전용 — 최근 추가된 보카 콘텐츠 조회 (상비 진단 도구).
 * 작업 환경에서 DB 직접 조회가 막혀 있을 때 브라우저로 확인하는 용도.
 *
 * 사용: /api/boss/voca-recent-words          (기본 최근 48시간)
 *      /api/boss/voca-recent-words?hours=24
 */
export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const hours = Math.min(24 * 30, Math.max(1, Number(searchParams.get('hours')) || 48));
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const admin = createAdminClient();

    const [{ data: books }, { data: days }] = await Promise.all([
      admin.from('voca_books').select('id, title, is_active'),
      admin.from('voca_days').select('id, book_id, day_number, created_at'),
    ]);
    const bookTitle = new Map((books ?? []).map((b) => [b.id, b.title + (b.is_active ? '' : ' (비활성)')]));
    const dayInfo = new Map((days ?? []).map((d) => [d.id, `${bookTitle.get(d.book_id) ?? '??'} / Day ${d.day_number}`]));

    // 기간 내 새로 만들어진 Day
    const newDays = (days ?? [])
      .filter((d) => d.created_at >= since)
      .map((d) => ({ location: dayInfo.get(d.id), created_at: d.created_at }));

    // 기간 내 새로 추가된 단어 — 위치별 그룹
    const { data: words } = await admin
      .from('voca_vocabulary')
      .select('front_text, back_text, day_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(2000);

    const grouped: Record<string, { count: number; words: string[] }> = {};
    for (const w of words ?? []) {
      const loc = dayInfo.get(w.day_id) ?? `삭제된 Day (${w.day_id})`;
      const g = (grouped[loc] ??= { count: 0, words: [] });
      g.count++;
      if (g.words.length < 100) g.words.push(`${w.front_text} — ${w.back_text}`);
    }

    return NextResponse.json({
      기간: `최근 ${hours}시간 (${since} 이후)`,
      새_Day: newDays,
      새_단어_수: (words ?? []).length,
      위치별_새_단어: grouped,
    });
  },
);
