import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

type User = { id: string; academy_id: string | null; role: string; is_active: boolean; created_at: string };
type AdminClient = ReturnType<typeof createAdminClient>;

function buildAcademyStats(allUsers: User[]) {
  const byAcademy = new Map<string, { total: number; students: number; active: number }>();
  let totalStudents = 0;
  let totalActive = 0;

  for (const u of allUsers) {
    if (!u.academy_id) continue;
    const prev = byAcademy.get(u.academy_id) || { total: 0, students: 0, active: 0 };
    prev.total++;
    if (u.role === 'student') {
      prev.students++;
      totalStudents++;
      if (u.is_active) { prev.active++; totalActive++; }
    }
    byAcademy.set(u.academy_id, prev);
  }

  return { byAcademy, totalStudents, totalActive };
}

async function getWeeklyActiveByAcademy(admin: AdminClient, allUsers: User[]) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const studentAcademyMap = new Map<string, string>();
  const studentIds: string[] = [];
  for (const u of allUsers) {
    if (u.role === 'student' && u.academy_id) {
      studentIds.push(u.id);
      studentAcademyMap.set(u.id, u.academy_id);
    }
  }

  const { data: recentProgress } = studentIds.length > 0
    ? await admin
        .from('naesin_student_progress')
        .select('student_id')
        .in('student_id', studentIds)
        .gte('updated_at', weekAgo.toISOString())
    : { data: [] };

  const activeByAcademy = new Map<string, Set<string>>();
  recentProgress?.forEach((p) => {
    const academyId = studentAcademyMap.get(p.student_id);
    if (academyId) {
      const set = activeByAcademy.get(academyId) || new Set();
      set.add(p.student_id);
      activeByAcademy.set(academyId, set);
    }
  });

  return activeByAcademy;
}

function buildMonthlyGrowth(allUsers: User[]) {
  const growth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = allUsers.filter((u) =>
      u.role === 'student' && u.created_at?.substring(0, 7) === month
    ).length;
    growth.push({ month, count });
  }
  return growth;
}

export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false, rateLimit: { max: 30, windowMs: 60_000 } },
  async () => {
    const admin = createAdminClient();

    const [{ data: academies }, { data: allUsers }, { data: subs }] = await Promise.all([
      admin.from('academies').select('id, name, max_students, created_at').order('created_at', { ascending: false }),
      admin.from('users').select('id, academy_id, role, is_active, created_at'),
      admin.from('subscriptions').select('status'),
    ]);

    const users = (allUsers || []) as User[];
    const { byAcademy, totalStudents, totalActive } = buildAcademyStats(users);
    const activeByAcademy = await getWeeklyActiveByAcademy(admin, users);

    const academyHealth = (academies || []).map((a) => {
      const stats = byAcademy.get(a.id) || { total: 0, students: 0, active: 0 };
      return {
        id: a.id,
        name: a.name,
        totalUsers: stats.total,
        students: stats.students,
        activeStudents: stats.active,
        maxStudents: a.max_students,
        weeklyActive: activeByAcademy.get(a.id)?.size || 0,
      };
    });

    const subDist: Record<string, number> = {};
    subs?.forEach((s) => { subDist[s.status] = (subDist[s.status] || 0) + 1; });

    return NextResponse.json({
      totalAcademies: academies?.length || 0,
      totalStudents,
      totalActive,
      academyHealth,
      monthlyGrowth: buildMonthlyGrowth(users),
      subscriptionDistribution: subDist,
    });
  }
);
