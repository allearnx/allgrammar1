import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { StudentDetail } from '@/components/dashboard/student-detail';
import { fetchNaesinExamData } from '@/lib/naesin/fetch-exam-data';

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { studentId } = await params;
  const user = await requireRole(['teacher', 'admin', 'boss']);

  const naesinData = await fetchNaesinExamData(studentId);

  return (
    <>
      <Topbar user={user} title="학생 상세" />
      <StudentDetail user={user} studentId={studentId} naesinData={naesinData} />
    </>
  );
}
