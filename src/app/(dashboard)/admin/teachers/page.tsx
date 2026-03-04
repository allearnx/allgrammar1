import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { fetchTeachersList } from '@/lib/dashboard/queries';
import { TeachersClient } from '@/components/dashboard/teachers-client';

export default async function AdminTeachersPage() {
  const user = await requireRole(['admin', 'boss']);
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
