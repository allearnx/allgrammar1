import { Topbar } from '@/components/layout/topbar';
import { StudentsList } from '@/components/dashboard/students-list';
import { getStudentsPageData } from '@/lib/dashboard/page-data';

export default async function TeacherStudentsPage() {
  const { user } = await getStudentsPageData(['teacher', 'admin', 'boss']);
  return (
    <>
      <Topbar user={user} title="학생 관리" />
      <StudentsList user={user} basePath="/teacher" />
    </>
  );
}
