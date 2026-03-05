import { Topbar } from '@/components/layout/topbar';
import { ContentClient } from '@/components/dashboard/content-client';
import { getContentPageData } from '@/lib/dashboard/page-data';

export default async function BossContentPage() {
  const { user, levels } = await getContentPageData(['boss']);
  return (
    <>
      <Topbar user={user} title="콘텐츠 관리" />
      <div className="p-4 md:p-6">
        <ContentClient levels={levels} />
      </div>
    </>
  );
}
