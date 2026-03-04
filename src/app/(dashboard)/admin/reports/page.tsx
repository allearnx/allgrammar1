import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { fetchStudentsList } from '@/lib/dashboard/queries';
import { ReportsClient } from '@/components/dashboard/reports-client';

export default async function AdminReportsPage() {
  const user = await requireRole(['admin', 'boss']);
  const students = await fetchStudentsList(user.academy_id);

  return (
    <>
      <Topbar user={user} title="리포트" />
      <div className="p-4 md:p-6">
        <ReportsClient students={students} />
      </div>
    </>
  );
}
