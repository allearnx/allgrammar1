import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * boss 전용 일회성 진단 — "학습 안 한 단어가 시험에 나옴" 사건 조사용 (2026-08-02).
 *
 * 작업 환경에서 DB 직접 조회가 막혀 있어, 브라우저(boss 로그인)로 이 주소를 열어
 * 결과 JSON을 확인하는 방식. 조사: ① 같은 제목 교재 중복 ② 교재 내 같은 번호 Day 중복
 * ③ 특정 단어(기본 circuit)가 어느 교재/Day에 있는지 ④ 특정 학생(기본 김지민)의
 * 시험 배정이 가리키는 Day와 실제 학습한 Day 대조.
 *
 * 사용: /api/boss/voca-day-audit?word=circuit&student=김지민
 * 조사 끝나면 삭제 예정.
 */
export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word') || 'circuit';
    const studentName = searchParams.get('student') || '김지민';
    const admin = createAdminClient();

    // ① 교재 전체 + 같은 제목 중복
    const { data: books } = await admin
      .from('voca_books')
      .select('id, title, is_active, created_at')
      .order('sort_order');
    const titleCounts = new Map<string, number>();
    for (const b of books ?? []) titleCounts.set(b.title, (titleCounts.get(b.title) ?? 0) + 1);
    const duplicateTitleBooks = (books ?? []).filter((b) => (titleCounts.get(b.title) ?? 0) > 1);

    // ② 전체 Day + 교재 내 같은 번호 중복
    const { data: days } = await admin
      .from('voca_days')
      .select('id, book_id, day_number, title');
    const bookTitle = new Map((books ?? []).map((b) => [b.id, b.title + (b.is_active ? '' : ' (비활성)')]));
    const dayInfo = new Map((days ?? []).map((d) => [d.id, `${bookTitle.get(d.book_id) ?? '??'} / Day ${d.day_number}`]));
    const numKey = (d: { book_id: string; day_number: number }) => `${d.book_id}:${d.day_number}`;
    const numCounts = new Map<string, number>();
    for (const d of days ?? []) numCounts.set(numKey(d), (numCounts.get(numKey(d)) ?? 0) + 1);
    const duplicateDays = (days ?? [])
      .filter((d) => (numCounts.get(numKey(d)) ?? 0) > 1)
      .map((d) => ({ ...d, book: bookTitle.get(d.book_id) }));

    // ③ 단어 위치 — 어느 교재/Day에 있나
    const { data: wordRows } = await admin
      .from('voca_vocabulary')
      .select('id, front_text, day_id, created_at')
      .ilike('front_text', word);
    const wordLocations = (wordRows ?? []).map((w) => ({
      front_text: w.front_text,
      location: dayInfo.get(w.day_id) ?? `삭제된 Day (${w.day_id})`,
      day_id: w.day_id,
      created_at: w.created_at,
    }));

    // ③-2 유의어/반의어 필드에 이 단어를 품은 표제어 — 2회독 시험은 이 필드에서 출제됨
    const { data: relRows } = await admin
      .from('voca_vocabulary')
      .select('front_text, back_text, synonyms, antonyms, day_id')
      .or(`synonyms.ilike.%${word}%,antonyms.ilike.%${word}%`);
    const relatedCarriers = (relRows ?? []).map((w) => ({
      headword: w.front_text,
      meaning: w.back_text,
      synonyms: w.synonyms,
      antonyms: w.antonyms,
      location: dayInfo.get(w.day_id) ?? `삭제된 Day (${w.day_id})`,
    }));

    // ③-3 특정 Day의 단어 전체 덤프 (?dump_day_ids=id1,id2)
    const dumpParam = searchParams.get('dump_day_ids');
    let dayDump: Record<string, string[]> = {};
    if (dumpParam) {
      const ids = dumpParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6);
      const { data: dumpRows } = await admin
        .from('voca_vocabulary')
        .select('front_text, day_id')
        .in('day_id', ids)
        .order('sort_order');
      dayDump = {};
      for (const r of dumpRows ?? []) {
        const key = dayInfo.get(r.day_id) ?? r.day_id;
        (dayDump[key] ??= []).push(r.front_text);
      }
    }

    // ④ 학생의 시험 배정 vs 실제 학습 Day
    const { data: students } = await admin
      .from('users')
      .select('id, full_name, academy_id')
      .eq('full_name', studentName);

    const studentReports = [];
    for (const s of students ?? []) {
      const { data: assigns } = await admin
        .from('voca_exam_assignments')
        .select('id, book_id, day_ids, title, created_at')
        .eq('student_id', s.id)
        .order('created_at', { ascending: false })
        .limit(20);
      const assignments = (assigns ?? []).map((a) => ({
        title: a.title,
        book: bookTitle.get(a.book_id) ?? a.book_id,
        created_at: a.created_at,
        days: ((a.day_ids as string[]) ?? []).map((id) => dayInfo.get(id) ?? `⚠️ 존재하지 않는 Day (${id})`),
      }));

      const { data: prog } = await admin
        .from('voca_student_progress')
        .select('day_id, flashcard_completed, quiz_score, spelling_score, updated_at')
        .eq('student_id', s.id)
        .order('updated_at', { ascending: false })
        .limit(100);
      const studiedDays = (prog ?? []).map((p) => ({
        day: dayInfo.get(p.day_id) ?? `삭제된 Day (${p.day_id})`,
        flashcard: p.flashcard_completed,
        quiz: p.quiz_score,
        spelling: p.spelling_score,
        updated_at: p.updated_at,
      }));

      studentReports.push({ name: s.full_name, id: s.id, assignments, studiedDays });
    }

    return NextResponse.json({
      설명: '보카 Day/교재 중복 + 시험 배정 대조 진단. 조사 후 이 API는 삭제 예정.',
      중복_제목_교재: duplicateTitleBooks,
      중복_번호_Day: duplicateDays,
      단어_위치: { 검색어: word, 위치: wordLocations },
      유의어_반의어로_품은_표제어: relatedCarriers,
      Day_단어_덤프: dayDump,
      학생_조사: studentReports,
      교재_수: (books ?? []).length,
      Day_수: (days ?? []).length,
    });
  },
);
