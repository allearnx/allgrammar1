import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchVocaExamGroups } from '@/lib/voca/fetch-exam-results';

// GET — 선생님/보스: 묶음 보너스 시험 결과 (검수 가시성)
//   학생별로 Day 조합(range)마다 최고점·재응시 횟수·최고점 회차 오답을 집계해 반환.
export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 30, windowMs: 60_000 } },
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    const admin = createAdminClient();
    const academyId = user.academy_id;
    if (!academyId && user.role !== 'boss') {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }

    // 1. voca 배정 학생 (학원 범위)
    let studentQuery = admin
      .from('service_assignments')
      .select('student_id, users!service_assignments_student_id_fkey!inner(id, full_name, is_active)')
      .eq('service', 'voca');
    if (academyId) studentQuery = studentQuery.eq('users.academy_id', academyId);
    studentQuery = studentQuery.eq('users.is_active', true);
    const { data: assignments } = await studentQuery;

    const studentNames = new Map<string, string>();
    for (const a of assignments || []) {
      const u = a.users as unknown as { id: string; full_name: string };
      if (u && !studentNames.has(u.id)) studentNames.set(u.id, u.full_name);
    }
    const studentIds = [...studentNames.keys()];
    if (studentIds.length === 0) return NextResponse.json({ students: [], dayTitles: {} });

    // 2. 시험 결과 집계 (오늘 본 게 학생별로 맨 위)
    const { groups, dayTitles } = await fetchVocaExamGroups(admin, studentIds, bookId);

    // 응시한 학생만, 오늘 응시한 학생이 맨 위로
    const students = groups
      .filter((g) => g.exams.length > 0)
      .map((g) => ({
        studentId: g.studentId,
        studentName: studentNames.get(g.studentId) ?? '-',
        exams: g.exams,
        latestAt: g.exams[0]?.lastAttemptAt ?? '',
        hasToday: g.exams.some((e) => e.isToday),
      }))
      .sort((a, b) => (a.latestAt < b.latestAt ? 1 : a.latestAt > b.latestAt ? -1 : 0));

    return NextResponse.json({ students, dayTitles });
  }
);
