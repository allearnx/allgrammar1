import { Topbar } from '@/components/layout/topbar';
import { ReportsClient } from '@/components/dashboard/reports-client';
import { getReportsPageData } from '@/lib/dashboard/page-data';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { canUseFeature } from '@/lib/billing/feature-gate';
import { PremiumGate } from '@/components/billing/premium-gate';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function ReportsPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const { user, students } = await getReportsPageData(allowedRoles);

  if (role === 'admin') {
    const planContext = await getPlanContext(user.academy_id);
    const reportsAllowed = canUseFeature(planContext.tier, 'reports');
    return (
      <>
        <Topbar user={user} title="리포트" />
        <div className="p-4 md:p-6">
          <PremiumGate allowed={reportsAllowed} feature="학생 리포트" role={user.role}>
            <ReportsClient students={students} />
          </PremiumGate>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar user={user} title="리포트" />
      <div className="p-4 md:p-6">
        <ReportsClient students={students} />
      </div>
    </>
  );
}
