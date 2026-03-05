import { Topbar } from '@/components/layout/topbar';
import { ContentClient } from '@/components/dashboard/content-client';
import { getContentPageData } from '@/lib/dashboard/page-data';

export default async function TeacherContentPage() {
  const { user, levels } = await getContentPageData(['teacher', 'admin', 'boss']);
  return (
    <>
      <Topbar user={user} title="콘텐츠 관리" />
      <div className="p-4 md:p-6">
        <ContentClient levels={levels} />
      </div>
    </>
  );
}
