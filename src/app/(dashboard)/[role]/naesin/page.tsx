import { Topbar } from '@/components/layout/topbar';
import { NaesinAdminClient } from '@/components/dashboard/naesin-admin';
import { getNaesinPageData } from '@/lib/naesin/admin-page';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function NaesinPage({ params, searchParams }: Props) {
  const { role } = await params;
  const { tab } = await searchParams;
  const { allowedRoles } = getRoleConfig(role);
  const { user, textbooks, unitCounts } = await getNaesinPageData(allowedRoles);
  return (
    <>
      <Topbar user={user} title="내신 관리" />
      <div className="p-4 md:p-6">
        <NaesinAdminClient textbooks={textbooks} unitCounts={unitCounts} initialTab={tab} canManageContent={user.role === 'boss' || !!user.can_manage_content} />
      </div>
    </>
  );
}
