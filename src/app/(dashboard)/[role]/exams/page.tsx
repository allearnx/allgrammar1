import { Topbar } from '@/components/layout/topbar';
import { ExamOverviewClient } from '@/components/dashboard/exam-overview';
import { getStudentsPageData } from '@/lib/dashboard/page-data';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function ExamOverviewPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles, basePath } = getRoleConfig(role);
  const { user } = await getStudentsPageData(allowedRoles);
  return (
    <>
      <Topbar user={user} title="시험 일정" />
      <ExamOverviewClient basePath={basePath} />
    </>
  );
}
