import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { VocaDayResultsClient } from '@/components/dashboard/voca-day-results-client';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function VocaDayResultsPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const user = await requireRole(allowedRoles);

  return (
    <>
      <Topbar user={user} title="Day별 학생 결과" />
      <div className="p-4 md:p-6">
        <VocaDayResultsClient />
      </div>
    </>
  );
}
