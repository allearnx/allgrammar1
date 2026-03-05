import { Topbar } from '@/components/layout/topbar';
import { ReportsClient } from '@/components/dashboard/reports-client';
import { getReportsPageData } from '@/lib/dashboard/page-data';

export default async function BossReportsPage() {
  const { user, students } = await getReportsPageData(['boss']);
  return (
    <>
      <Topbar user={user} title="리포트" />
      <div className="p-4 md:p-6">
        <ReportsClient students={students} />
      </div>
    </>
  );
}
