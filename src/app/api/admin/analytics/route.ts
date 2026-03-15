import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

function buildDailyActivity(recentProgress: { updated_at: string }[]) {
  const daily: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    daily[d.toISOString().split('T')[0]] = 0;
  }
  for (const p of recentProgress) {
    if (p.updated_at) {
      const day = new Date(p.updated_at).toISOString().split('T')[0];
      if (daily[day] !== undefined) daily[day]++;
    }
  }
  return Object.entries(daily).map(([date, count]) => ({ date, count }));
}

function buildRankings(
  students: { id: string; full_name: string }[],
  completions: { student_id: string; vocab_completed: boolean; passage_completed: boolean; grammar_completed: boolean; problem_completed: boolean }[]
) {
  const byStudent = new Map<string, number>();
  for (const c of completions) {
    const count = (c.vocab_completed ? 1 : 0) + (c.passage_completed ? 1 : 0) + (c.grammar_completed ? 1 : 0) + (c.problem_completed ? 1 : 0);
    byStudent.set(c.student_id, (byStudent.get(c.student_id) || 0) + count);
  }
  return students
    .map((s) => ({ id: s.id, name: s.full_name, completedStages: byStudent.get(s.id) || 0 }))
    .sort((a, b) => b.completedStages - a.completedStages)
    .slice(0, 20);
}

async function getServiceCounts(admin: AdminClient, studentIds: string[]) {
  if (studentIds.length === 0) return { naesinCount: 0, vocaCount: 0 };
  const { data: assignments } = await admin.from('service_assignments').select('student_id, service').in('student_id', studentIds);
  return {
    naesinCount: new Set(assignments?.filter((a) => a.service === 'naesin').map((a) => a.student_id)).size,
    vocaCount: new Set(assignments?.filter((a) => a.service === 'voca').map((a) => a.student_id)).size,
  };
}

export const GET = createApiHandler(
  { roles: ['admin', 'boss'], hasBody: false, rateLimit: { max: 30, windowMs: 60_000 } },
  async ({ user }) => {
    if (!user.academy_id) {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }
    const admin = createAdminClient();
    const academyId = user.academy_id;

    const { data: students } = await admin
      .from('users')
      .select('id, full_name, is_active')
      .eq('role', 'student')
      .eq('academy_id', academyId)
      .order('full_name');

    const studentIds = students?.map((s) => s.id) || [];
    const totalStudents = students?.length || 0;
    const activeStudents = students?.filter((s) => s.is_active).length || 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Parallel fetches
    const [serviceCounts, { data: recentProgress }, { data: completions }] = await Promise.all([
      getServiceCounts(admin, studentIds),
      studentIds.length > 0
        ? admin.from('naesin_student_progress').select('student_id, updated_at').in('student_id', studentIds).gte('updated_at', weekAgo.toISOString())
        : Promise.resolve({ data: [] as { student_id: string; updated_at: string }[] }),
      studentIds.length > 0
        ? admin.from('naesin_student_progress').select('student_id, vocab_completed, passage_completed, grammar_completed, problem_completed').in('student_id', studentIds)
        : Promise.resolve({ data: [] as { student_id: string; vocab_completed: boolean; passage_completed: boolean; grammar_completed: boolean; problem_completed: boolean }[] }),
    ]);

    return NextResponse.json({
      totalStudents,
      activeStudents,
      weeklyActiveStudents: new Set(recentProgress?.map((p) => p.student_id)).size,
      ...serviceCounts,
      dailyActivity: buildDailyActivity(recentProgress || []),
      rankings: buildRankings(students || [], completions || []),
    });
  }
);
