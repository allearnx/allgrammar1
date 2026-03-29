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
    .select('id, academy_id, full_name, role, email, phone');

  const countByAcademy = new Map<string, number>();
  const studentCountByAcademy = new Map<string, number>();
  const teachersByAcademy = new Map<string, string[]>();
  const ownerByUserId = new Map<string, { full_name: string; email: string; phone: string | null }>();
  allUsers?.forEach((u) => {
    ownerByUserId.set(u.id, { full_name: u.full_name, email: u.email, phone: u.phone });
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

  const academiesWithCounts = (academies || []).map((a) => {
    const owner = a.owner_id ? ownerByUserId.get(a.owner_id) : null;
    return {
      ...a,
      user_count: countByAcademy.get(a.id) || 0,
      student_count: studentCountByAcademy.get(a.id) || 0,
      max_students: a.max_students as number | null,
      teachers: teachersByAcademy.get(a.id) || [],
      services: (a.services as string[]) || [],
      owner_name: owner?.full_name || null,
      owner_email: owner?.email || null,
      owner_phone: owner?.phone || null,
    };
  });

  return (
    <>
      <Topbar user={user} title="학원 관리" />
      <div className="p-4 md:p-6">
        <AcademiesClient academies={academiesWithCounts} />
      </div>
    </>
  );
}
