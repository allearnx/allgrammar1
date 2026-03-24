import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { StudentDetail } from '@/components/dashboard/student-detail';
import { fetchNaesinExamData } from '@/lib/naesin/fetch-exam-data';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string; studentId: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { role, studentId } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const user = await requireRole(allowedRoles);
  const naesinData = await fetchNaesinExamData(studentId);
  return (
    <>
      <Topbar user={user} title="학생 상세" />
      <StudentDetail user={user} studentId={studentId} naesinData={naesinData} />
    </>
  );
}
