import { Topbar } from '@/components/layout/topbar';
import { TeachersClient } from '@/components/dashboard/teachers-client';
import { getTeachersPageData } from '@/lib/dashboard/page-data';

export default async function BossTeachersPage() {
  const { user, teachers } = await getTeachersPageData(['boss']);
  return (
    <>
      <Topbar user={user} title="선생님 관리" />
      <div className="p-4 md:p-6">
        <TeachersClient teachers={teachers} />
      </div>
    </>
  );
}
