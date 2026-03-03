import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { StudentsList } from '@/components/dashboard/students-list';

export default async function BossStudentsPage() {
  const user = await requireRole(['boss']);
  return (
    <>
      <Topbar user={user} title="학생 관리" />
      <StudentsList user={user} basePath="/boss" />
    </>
  );
}
