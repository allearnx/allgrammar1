import { Topbar } from '@/components/layout/topbar';
import { StudentsList } from '@/components/dashboard/students-list';
import { getStudentsPageData } from '@/lib/dashboard/page-data';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function StudentsPage({ params, searchParams }: Props) {
  const { role } = await params;
  const { q } = await searchParams;
  const { allowedRoles, basePath } = getRoleConfig(role);
  const { user } = await getStudentsPageData(allowedRoles);
  return (
    <>
      <Topbar user={user} title="학생 관리" />
      <StudentsList user={user} basePath={basePath} searchQuery={q} />
    </>
  );
}
