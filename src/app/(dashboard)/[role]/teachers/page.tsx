import { notFound } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { TeachersClient } from '@/components/dashboard/teachers-client';
import { getTeachersPageData } from '@/lib/dashboard/page-data';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function TeachersPage({ params }: Props) {
  const { role } = await params;
  if (role === 'teacher') notFound();
  const { allowedRoles } = getRoleConfig(role);
  const { user, teachers } = await getTeachersPageData(allowedRoles);

  let academies: { id: string; name: string }[] | undefined;
  if (role === 'boss') {
    const admin = createAdminClient();
    const { data } = await admin
      .from('academies')
      .select('id, name')
      .order('name');
    academies = data || [];
  }

  return (
    <>
      <Topbar user={user} title="선생님 관리" />
      <div className="p-4 md:p-6">
        <TeachersClient teachers={teachers} academies={academies} />
      </div>
    </>
  );
}
