import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';

type WrongWord = { front_text: string; back_text: string };
interface ExamRow {
  student_id: string;
  book_id: string | null;
  day_ids: string[];
  range_key: string;
  attempt_number: number;
  score: number;
  wrong_words: WrongWord[] | null;
  created_at: string;
}
interface ExamGroup {
  rangeKey: string;
  dayIds: string[];
  attempts: number;
  bestScore: number;
  wrongWords: WrongWord[];
}

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

    // 2. 시험 결과
    let examQuery = admin
      .from('voca_exam_results')
      .select('student_id, book_id, day_ids, range_key, attempt_number, score, wrong_words, created_at')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });
    if (bookId) examQuery = examQuery.eq('book_id', bookId);
    const { data: rowsRaw } = await examQuery;
    const rows = (rowsRaw as ExamRow[] | null) ?? [];

    // 3. Day 제목 매핑
    const allDayIds = new Set<string>();
    for (const r of rows) for (const d of r.day_ids || []) allDayIds.add(d);
    const dayTitles: Record<string, string> = {};
    if (allDayIds.size > 0) {
      const { data: days } = await admin.from('voca_days').select('id, title').in('id', [...allDayIds]);
      for (const d of days || []) dayTitles[d.id] = d.title;
    }

    // 4. 학생 + range_key별 집계 (최고점·재응시 횟수·최고점 회차 오답)
    const byStudent = new Map<string, Map<string, ExamGroup>>();
    for (const r of rows) {
      if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, new Map());
      const ranges = byStudent.get(r.student_id)!;
      const ex = ranges.get(r.range_key) ?? { rangeKey: r.range_key, dayIds: r.day_ids, attempts: 0, bestScore: -1, wrongWords: [] };
      ex.attempts += 1;
      if (r.score > ex.bestScore) {
        ex.bestScore = r.score;
        ex.wrongWords = r.wrong_words || [];
      }
      ranges.set(r.range_key, ex);
    }

    const students = [...byStudent.entries()]
      .map(([studentId, ranges]) => ({
        studentId,
        studentName: studentNames.get(studentId) ?? '-',
        exams: [...ranges.values()].sort((a, b) => b.dayIds.length - a.dayIds.length),
      }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName));

    return NextResponse.json({ students, dayTitles });
  }
);
