import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { VocaExamResultsClient } from '@/components/dashboard/voca-exam-results-client';
import { VocaExamAssignPanel } from '@/components/dashboard/voca-exam-assign-panel';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function VocaExamResultsPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const user = await requireRole(allowedRoles);

  return (
    <>
      <Topbar user={user} title="올킬시험 관리" />
      <div className="p-4 md:p-6 space-y-6">
        <VocaExamAssignPanel />
        <VocaExamResultsClient />
      </div>
    </>
  );
}
