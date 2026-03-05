import { Topbar } from '@/components/layout/topbar';
import { TeachersClient } from '@/components/dashboard/teachers-client';
import { getTeachersPageData } from '@/lib/dashboard/page-data';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function BossTeachersPage() {
  const { user, teachers } = await getTeachersPageData(['boss']);

  const admin = createAdminClient();
  const { data: academies } = await admin
    .from('academies')
    .select('id, name')
    .order('name');

  return (
    <>
      <Topbar user={user} title="선생님 관리" />
      <div className="p-4 md:p-6">
        <TeachersClient teachers={teachers} academies={academies || []} />
      </div>
    </>
  );
}
