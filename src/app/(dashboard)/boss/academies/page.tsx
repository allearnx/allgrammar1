import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { AcademiesClient } from './client';

export default async function BossAcademiesPage() {
  const user = await requireRole(['boss']);
  const admin = createAdminClient();

  const { data: academies } = await admin
    .from('academies')
    .select('*')
    .order('created_at', { ascending: false });

  // Get user counts and teacher info per academy
  const { data: allUsers } = await admin
    .from('users')
    .select('academy_id, full_name, role');

  const countByAcademy = new Map<string, number>();
  const studentCountByAcademy = new Map<string, number>();
  const teachersByAcademy = new Map<string, string[]>();
  allUsers?.forEach((u) => {
    if (u.academy_id) {
      countByAcademy.set(u.academy_id, (countByAcademy.get(u.academy_id) || 0) + 1);
      if (u.role === 'student') {
        studentCountByAcademy.set(u.academy_id, (studentCountByAcademy.get(u.academy_id) || 0) + 1);
      }
      if (u.role === 'teacher') {
        const list = teachersByAcademy.get(u.academy_id) || [];
        list.push(u.full_name);
        teachersByAcademy.set(u.academy_id, list);
      }
    }
  });

  const academiesWithCounts = (academies || []).map((a) => ({
    ...a,
    user_count: countByAcademy.get(a.id) || 0,
    student_count: studentCountByAcademy.get(a.id) || 0,
    max_students: a.max_students as number | null,
    teachers: teachersByAcademy.get(a.id) || [],
    services: (a.services as string[]) || [],
  }));

  return (
    <>
      <Topbar user={user} title="학원 관리" />
      <div className="p-4 md:p-6">
        <AcademiesClient academies={academiesWithCounts} />
      </div>
    </>
  );
}
