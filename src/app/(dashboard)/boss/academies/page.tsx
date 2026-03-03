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

  // Get user counts per academy
  const { data: userCounts } = await admin
    .from('users')
    .select('academy_id');

  const countByAcademy = new Map<string, number>();
  userCounts?.forEach((u) => {
    if (u.academy_id) {
      countByAcademy.set(u.academy_id, (countByAcademy.get(u.academy_id) || 0) + 1);
    }
  });

  const academiesWithCounts = (academies || []).map((a) => ({
    ...a,
    user_count: countByAcademy.get(a.id) || 0,
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
