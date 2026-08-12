import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * boss 전용 — 교재 간 단어 연계율(겹침) 분석 (상비 진단 도구).
 * 진단 라인업 난이도 배치의 데이터 근거용 (7/23 교과서 단어 교차 분석의 확장).
 *
 * 사용: /api/boss/voca-overlap                      (기본 타겟: 능률 VOCA 중등 필수)
 *      /api/boss/voca-overlap?book=워드마스터 중등 고난도
 *
 * 반환:
 * - 타겟_교재_분석: 타겟과 다른 모든 교재의 겹침 (양방향 %)
 * - 교과서_프로필: 각 교재가 중1·중2·중3 교과서 단어를 몇 % 덮는지 (난이도 위치 지표)
 */
export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const targetTitle = searchParams.get('book') || '능률 VOCA 중등 필수';
    const admin = createAdminClient();

    const { data: books } = await admin
      .from('voca_books')
      .select('id, title, is_active')
      .eq('is_active', true)
      .order('sort_order');
    const { data: days } = await admin.from('voca_days').select('id, book_id');
    const dayToBook = new Map((days ?? []).map((d) => [d.id, d.book_id]));

    // 전체 단어 로드 — PostgREST 기본 1000행 제한이 있어 페이지 순회
    const bookWords = new Map<string, Set<string>>();
    const PAGE = 1000;
    for (let offset = 0; ; offset += PAGE) {
      const { data: rows, error } = await admin
        .from('voca_vocabulary')
        .select('front_text, day_id')
        .order('id')
        .range(offset, offset + PAGE - 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      for (const r of rows ?? []) {
        const bookId = dayToBook.get(r.day_id);
        if (!bookId) continue;
        const set = bookWords.get(bookId) ?? new Set<string>();
        set.add(r.front_text.trim().toLowerCase());
        bookWords.set(bookId, set);
      }
      if (!rows || rows.length < PAGE) break;
    }

    const list = (books ?? [])
      .map((b) => ({ id: b.id, title: b.title, words: bookWords.get(b.id) ?? new Set<string>() }))
      .filter((b) => b.words.size > 0);

    const intersect = (a: Set<string>, b: Set<string>) => {
      let n = 0;
      for (const w of a) if (b.has(w)) n++;
      return n;
    };
    const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

    // ① 타겟 교재 vs 나머지 전부
    const target = list.find((b) => b.title === targetTitle);
    const targetAnalysis = target
      ? list
          .filter((b) => b.id !== target.id)
          .map((b) => {
            const both = intersect(target.words, b.words);
            return {
              교재: b.title,
              겹침_단어수: both,
              [`타겟(${target.title})의 몇 %`]: pct(both, target.words.size),
              '상대 교재의 몇 %': pct(both, b.words.size),
            };
          })
          .sort((a, b) => (b.겹침_단어수 as number) - (a.겹침_단어수 as number))
      : `'${targetTitle}' 교재를 찾지 못했거나 단어가 없음`;

    // ② 전 교재의 학년 프로필 — 교과서 단어 세트 대비 커버리지 (난이도 위치 지표)
    const anchors = ['초등 필수 영어단어 800', '중1 교과서 단어', '중2 교과서 단어', '중3 교과서 단어']
      .map((t) => list.find((b) => b.title === t))
      .filter((b): b is NonNullable<typeof b> => !!b);
    const profiles = list.map((b) => {
      const row: Record<string, string | number> = { 교재: b.title, 단어수: b.words.size };
      for (const a of anchors) {
        if (a.id === b.id) continue;
        // "이 교재가 앵커 단어의 몇 %를 담고 있나" — 높을수록 그 학년 대비에 유리
        row[`${a.title} 커버`] = pct(intersect(b.words, a.words), a.words.size);
      }
      return row;
    });

    return NextResponse.json({
      설명: '교재 간 단어 겹침 분석. 타겟 변경: ?book=교재명',
      타겟: target ? `${target.title} (고유 단어 ${target.words.size}개)` : targetTitle,
      타겟_교재_분석: targetAnalysis,
      교과서_프로필: profiles,
    });
  },
);
