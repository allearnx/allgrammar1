import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { VocaSubmissionsClient } from '@/components/dashboard/voca-submissions-client';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function VocaSubmissionsPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const user = await requireRole(allowedRoles);

  return (
    <>
      <Topbar user={user} title="오답노트 확인" />
      <div className="p-4 md:p-6">
        <VocaSubmissionsClient />
      </div>
    </>
  );
}
