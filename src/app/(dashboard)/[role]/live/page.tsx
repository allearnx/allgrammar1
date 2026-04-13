import { Topbar } from '@/components/layout/topbar';
import { LiveMonitorClient } from '@/components/dashboard/live-monitor';
import { getStudentsPageData } from '@/lib/dashboard/page-data';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function LiveMonitorPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles, basePath } = getRoleConfig(role);
  const { user } = await getStudentsPageData(allowedRoles);
  return (
    <>
      <Topbar user={user} title="실시간 학습활동 모니터링" />
      <LiveMonitorClient basePath={basePath} />
    </>
  );
}
