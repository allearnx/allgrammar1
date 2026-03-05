import { Topbar } from '@/components/layout/topbar';
import { StudentsList } from '@/components/dashboard/students-list';
import { getStudentsPageData } from '@/lib/dashboard/page-data';

export default async function AdminStudentsPage() {
  const { user } = await getStudentsPageData(['admin', 'boss']);
  return (
    <>
      <Topbar user={user} title="학생 관리" />
      <StudentsList user={user} basePath="/admin" />
    </>
  );
}
