import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { StudentsList } from '@/components/dashboard/students-list';

export default async function AdminStudentsPage() {
  const user = await requireRole(['admin', 'boss']);
  return (
    <>
      <Topbar user={user} title="학생 관리" />
      <StudentsList user={user} basePath="/admin" />
    </>
  );
}
