import { NextResponse } from 'next/server';
import { createApiHandler, ForbiddenError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { vocaExamAssignmentCreateSchema, vocaExamAssignmentDeleteSchema } from '@/lib/api/schemas';

const STAFF = ['teacher', 'admin', 'boss'] as const;

interface AssignmentRow {
  id: string;
  student_id: string;
  book_id: string;
  day_ids: string[];
  title: string | null;
  created_at: string;
}

// POST — 선생님/보스가 학생들에게 묶음 시험 배정
export const POST = createApiHandler(
  { roles: [...STAFF], schema: vocaExamAssignmentCreateSchema },
  async ({ user, body, supabase }) => {
    const { bookId, dayIds, studentIds, title, secondsPerWord, examType } = body;
    for (const sid of studentIds) await requireAcademyScope(user, sid, supabase);

    const sortedDayIds = [...dayIds].sort();
    const rangeKey = sortedDayIds.join(',');
    const admin = createAdminClient();
    const rows = studentIds.map((sid) => ({
      student_id: sid,
      book_id: bookId,
      day_ids: sortedDayIds,
      range_key: rangeKey,
      title: title ?? null,
      seconds_per_word: secondsPerWord ?? null,
      exam_type: examType,
      assigned_by: user.id,
    }));

    const { error } = await admin.from('voca_exam_assignments').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, count: rows.length });
  },
);

// GET — 스태프 관리 화면: 학원 voca 학생 목록 + 배정 목록(최고점 포함)
export const GET = createApiHandler(
  { roles: [...STAFF], hasBody: false, rateLimit: { max: 30, windowMs: 60_000 } },
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const admin = createAdminClient();
    const academyId = user.academy_id;
    if (!academyId && user.role !== 'boss') {
      throw new ForbiddenError('학원에 소속되어 있지 않습니다.');
    }

    // 학원 voca 학생
    let sq = admin
      .from('service_assignments')
      .select('student_id, users!service_assignments_student_id_fkey!inner(id, full_name, is_active)')
      .eq('service', 'voca');
    if (academyId) {
      sq = sq.eq('users.academy_id', academyId);
    } else {
      // boss에 학원이 없으면 필터가 통째로 꺼져 개인 무료 가입자까지 전부 떴다
      // (2026-08-09 현장 피드백 "우리 학원 아닌 애들이 다 뜬다") — 최소한 무학원 제외
      sq = sq.not('users.academy_id', 'is', null);
    }
    sq = sq.eq('users.is_active', true);
    const { data: assigns } = await sq;
    const names = new Map<string, string>();
    for (const a of assigns || []) {
      const u = a.users as unknown as { id: string; full_name: string };
      if (u && !names.has(u.id)) names.set(u.id, u.full_name);
    }
    const studentIds = [...names.keys()];
    if (studentIds.length === 0) {
      return NextResponse.json({ students: [], assignments: [], dayTitles: {}, progressByBook: {} });
    }

    // 학생별 배정 교재 + 교재별 학습 진도(최대 Day 번호) — 학생-우선 배정 플로우용:
    // 선생님이 학생의 교재·진도를 외우지 않아도 화면이 보여준다 (2026-08-09 개편)
    const [{ data: bookAssigns }, { data: progRows }] = await Promise.all([
      admin.from('voca_book_assignments').select('student_id, book_id').in('student_id', studentIds),
      admin
        .from('voca_student_progress')
        .select('student_id, day:voca_days(book_id, day_number)')
        .in('student_id', studentIds),
    ]);
    const assignedBook = new Map((bookAssigns ?? []).map((b) => [b.student_id, b.book_id]));
    const progressByBook: Record<string, Record<string, number>> = {};
    for (const p of progRows ?? []) {
      const day = p.day as unknown as { book_id: string; day_number: number } | null;
      if (!day) continue;
      const byBook = (progressByBook[p.student_id as string] ??= {});
      byBook[day.book_id] = Math.max(byBook[day.book_id] ?? 0, day.day_number);
    }

    const students = studentIds
      .map((id) => ({ id, name: names.get(id) ?? '-', bookId: assignedBook.get(id) ?? null }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    // 배정 목록
    let aq = admin
      .from('voca_exam_assignments')
      .select('id, student_id, book_id, day_ids, title, created_at')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });
    if (bookId) aq = aq.eq('book_id', bookId);
    const { data: aRaw } = await aq;
    const assignments = (aRaw as AssignmentRow[] | null) ?? [];

    // 배정별 최고점/응시횟수
    const assignmentIds = assignments.map((a) => a.id);
    const bestByAssignment = new Map<string, { best: number; attempts: number }>();
    if (assignmentIds.length > 0) {
      const { data: results } = await admin
        .from('voca_exam_results')
        .select('assignment_id, score')
        .in('assignment_id', assignmentIds);
      for (const r of results || []) {
        const aid = r.assignment_id as string;
        const cur = bestByAssignment.get(aid) ?? { best: -1, attempts: 0 };
        cur.attempts += 1;
        if ((r.score as number) > cur.best) cur.best = r.score as number;
        bestByAssignment.set(aid, cur);
      }
    }

    // Day 제목
    const allDayIds = new Set<string>();
    for (const a of assignments) for (const d of a.day_ids || []) allDayIds.add(d);
    const dayTitles: Record<string, string> = {};
    if (allDayIds.size > 0) {
      const { data: days } = await admin.from('voca_days').select('id, title').in('id', [...allDayIds]);
      for (const d of days || []) dayTitles[d.id] = d.title;
    }

    return NextResponse.json({
      students,
      progressByBook,
      dayTitles,
      assignments: assignments.map((a) => {
        const r = bestByAssignment.get(a.id);
        return {
          id: a.id,
          studentId: a.student_id,
          studentName: names.get(a.student_id) ?? '-',
          bookId: a.book_id,
          dayIds: a.day_ids,
          title: a.title,
          bestScore: r && r.best >= 0 ? r.best : null,
          attempts: r?.attempts ?? 0,
        };
      }),
    });
  },
);

// DELETE — 배정 해제
export const DELETE = createApiHandler(
  { roles: [...STAFF], schema: vocaExamAssignmentDeleteSchema, hasBody: true },
  async ({ user, body, supabase }) => {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from('voca_exam_assignments')
      .select('student_id')
      .eq('id', body.id)
      .single();
    if (!row) return NextResponse.json({ error: '배정을 찾을 수 없습니다.' }, { status: 404 });
    await requireAcademyScope(user, row.student_id as string, supabase);
    const { error } = await admin.from('voca_exam_assignments').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  },
);
