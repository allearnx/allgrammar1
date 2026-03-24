import { Topbar } from '@/components/layout/topbar';
import { NaesinAdminClient } from '@/components/dashboard/naesin-admin';
import { getNaesinPageData } from '@/lib/naesin/admin-page';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function NaesinPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const { user, textbooks } = await getNaesinPageData(allowedRoles);
  return (
    <>
      <Topbar user={user} title="내신 관리" />
      <div className="p-4 md:p-6">
        <NaesinAdminClient textbooks={textbooks} />
      </div>
    </>
  );
}
