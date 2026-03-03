import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { StudentDetail } from '@/components/dashboard/student-detail';

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function BossStudentDetailPage({ params }: Props) {
  const { studentId } = await params;
  const user = await requireRole(['boss']);
  return (
    <>
      <Topbar user={user} title="학생 상세" />
      <StudentDetail user={user} studentId={studentId} />
    </>
  );
}
