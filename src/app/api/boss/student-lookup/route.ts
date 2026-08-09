import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatLevel, recommendBandKey, getBand, type BandKey } from '@/lib/voca/diagnostic-bands';
import { lineupPlacement } from '@/lib/voca/diagnostic-lineup';

/**
 * boss 전용 — 학생 한 명의 보카 현황 한눈에 보기 (상비 진단 도구).
 * 진단 결과·추천 교재·배정 교재·진도·시험 기록을 한 번에 대조한다.
 *
 * 사용: /api/boss/student-lookup?name=이승유
 */
export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ error: '?name=학생이름 을 붙여주세요' }, { status: 400 });

    const admin = createAdminClient();
    const { data: students } = await admin
      .from('users')
      .select('id, full_name, email, role, academy_id, is_active, created_at')
      .ilike('full_name', `%${name}%`)
      .eq('role', 'student');

    if (!students || students.length === 0) {
      return NextResponse.json({ 결과: `'${name}' 이름의 학생을 찾지 못했어요.` });
    }

    const [{ data: books }, { data: days }, { data: academies }] = await Promise.all([
      admin.from('voca_books').select('id, title, is_active'),
      admin.from('voca_days').select('id, book_id, day_number'),
      admin.from('academies').select('id, name'),
    ]);
    const bookTitle = new Map((books ?? []).map((b) => [b.id, b.title]));
    const academyName = new Map((academies ?? []).map((a) => [a.id, a.name]));
    const dayToBook = new Map((days ?? []).map((d) => [d.id, d.book_id]));
    const dayLabel = new Map(
      (days ?? []).map((d) => [d.id, `${bookTitle.get(d.book_id) ?? '??'} / Day ${d.day_number}`]),
    );
    const activeBands = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as BandKey[];

    const reports = [];
    for (const s of students) {
      const [{ data: diags }, { data: bookAssign }, { data: prog }, { data: exams }, { data: services }] =
        await Promise.all([
          admin
            .from('voca_diagnostic_results')
            .select('grade, start_band, final_band, final_qualifier, coverage_score, rounds, attempt_number, created_at')
            .eq('student_id', s.id)
            .order('created_at', { ascending: false })
            .limit(5),
          admin.from('voca_book_assignments').select('book_id, created_at').eq('student_id', s.id).maybeSingle(),
          admin
            .from('voca_student_progress')
            .select('day_id, flashcard_completed, quiz_score, spelling_score, updated_at')
            .eq('student_id', s.id)
            .order('updated_at', { ascending: false })
            .limit(30),
          admin
            .from('voca_exam_results')
            .select('score, exam_type, attempt_number, day_ids, created_at')
            .eq('student_id', s.id)
            .order('created_at', { ascending: false })
            .limit(10),
          admin.from('service_assignments').select('service, created_at').eq('student_id', s.id),
        ]);

      // 진단 결과 → 판정 레벨 + 추천 교재 (결과 화면과 동일한 계산)
      const diagnostics = (diags ?? []).map((d) => {
        const level = { band: d.final_band as BandKey, qualifier: d.final_qualifier as 'exact' | 'above' | 'below' };
        const recBand = recommendBandKey(level, activeBands);
        const placement = lineupPlacement(recBand);
        const rounds = (d.rounds as { band: string; correct: number; total: number }[] | null) ?? [];
        return {
          응시일: d.created_at,
          회차: d.attempt_number,
          선택학년: d.grade,
          판정레벨: formatLevel(level),
          '본인학년_단어_정답률(%)': d.coverage_score,
          추천교재: placement.highlightTitle,
          추천칸: getBand(recBand).label,
          라운드별: rounds.map((r) => `${getBand(r.band as BandKey).label} ${r.correct}/${r.total}`),
        };
      });

      // 학습한 교재별 진도 요약
      const byBook: Record<string, number> = {};
      for (const p of prog ?? []) {
        const t = bookTitle.get(dayToBook.get(p.day_id) ?? '') ?? '??';
        byBook[t] = (byBook[t] ?? 0) + 1;
      }

      reports.push({
        이름: s.full_name,
        이메일: s.email,
        학원: s.academy_id ? academyName.get(s.academy_id) ?? s.academy_id : '(개인)',
        활성: s.is_active,
        가입일: s.created_at,
        배정서비스: (services ?? []).map((v) => v.service),
        배정교재: bookAssign?.book_id ? bookTitle.get(bookAssign.book_id) : '(없음)',
        진단결과: diagnostics.length > 0 ? diagnostics : '(진단 기록 없음)',
        최근진도: (prog ?? []).slice(0, 15).map((p) => ({
          day: dayLabel.get(p.day_id) ?? p.day_id,
          카드: p.flashcard_completed,
          퀴즈: p.quiz_score,
          스펠링: p.spelling_score,
          갱신: p.updated_at,
        })),
        교재별_진도_Day수: byBook,
        시험기록: (exams ?? []).map((e) => ({
          점수: e.score,
          유형: e.exam_type,
          시도: e.attempt_number,
          days: ((e.day_ids as string[]) ?? []).map((id) => dayLabel.get(id) ?? id),
          응시일: e.created_at,
        })),
      });
    }

    return NextResponse.json({ 검색어: name, 학생수: reports.length, 학생: reports });
  },
);
