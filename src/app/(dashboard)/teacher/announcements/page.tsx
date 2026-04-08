import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { AnnouncementsReadOnly } from '@/components/shared/announcements-read-only';

export default async function TeacherAnnouncementsPage() {
  const user = await requireRole(['teacher', 'boss']);

  return (
    <>
      <Topbar user={user} title="공지사항" />
      <div className="p-4 md:p-6">
        <AnnouncementsReadOnly />
      </div>
    </>
  );
}
