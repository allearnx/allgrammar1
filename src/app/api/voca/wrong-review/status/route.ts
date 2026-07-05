import { NextResponse } from 'next/server';
import { createApiHandler, ForbiddenError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

// 현재 주 월요일 (UTC 기준)
function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

// GET: 선생님용 — 학원 학생들의 이번 주 올킬오답 현황
export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 30, windowMs: 60_000 } },
  async ({ user }) => {
    const admin = createAdminClient();
    const academyId = user.academy_id;
    const weekStart = getCurrentMonday();

    if (!academyId && user.role !== 'boss') {
      throw new ForbiddenError('학원에 소속되어 있지 않습니다.');
    }

    // 1. Get voca-assigned students (filtered by academy)
    let studentQuery = admin
      .from('service_assignments')
      .select('student_id, users!inner(id, full_name, is_active)')
      .eq('service', 'voca');

    if (academyId) {
      studentQuery = studentQuery.eq('users.academy_id', academyId);
    }
    studentQuery = studentQuery.eq('users.is_active', true);

    const { data: assignments } = await studentQuery;
    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ students: [] });
    }

    // Deduplicate
    const studentMap = new Map<string, { id: string; name: string }>();
    for (const a of assignments) {
      const u = a.users as unknown as { id: string; full_name: string };
      if (u && !studentMap.has(u.id)) {
        studentMap.set(u.id, { id: u.id, name: u.full_name });
      }
    }

    const studentIds = [...studentMap.keys()];

    // 2. Fetch this week's wrong_review records
    const { data: reviews } = await admin
      .from('voca_wrong_review')
      .select('student_id, total_words, graduated_count, completed_at')
      .eq('week_start', weekStart)
      .in('student_id', studentIds);

    const reviewMap = new Map<string, NonNullable<typeof reviews>[0]>();
    for (const r of reviews || []) {
      reviewMap.set(r.student_id, r);
    }

    // 3. Build response
    const students = [...studentMap.values()]
      .map((s) => {
        const r = reviewMap.get(s.id);
        return {
          studentId: s.id,
          studentName: s.name,
          totalWords: r?.total_words ?? 0,
          graduatedCount: r?.graduated_count ?? 0,
          completedAt: r?.completed_at ?? null,
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ko'));

    return NextResponse.json({ students });
  },
);
