import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { fetchTeachersList } from '@/lib/dashboard/queries';
import { TeachersClient } from '@/app/(dashboard)/admin/teachers/client';

export default async function BossTeachersPage() {
  const user = await requireRole(['boss']);
  const teachers = await fetchTeachersList(user.academy_id);

  return (
    <>
      <Topbar user={user} title="선생님 관리" />
      <div className="p-4 md:p-6">
        <TeachersClient teachers={teachers} />
      </div>
    </>
  );
}
