import { Topbar } from '@/components/layout/topbar';
import { StudentsList } from '@/components/dashboard/students-list';
import { getStudentsPageData } from '@/lib/dashboard/page-data';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function StudentsPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles, basePath } = getRoleConfig(role);
  const { user } = await getStudentsPageData(allowedRoles);
  return (
    <>
      <Topbar user={user} title="학생 관리" />
      <StudentsList user={user} basePath={basePath} />
    </>
  );
}
