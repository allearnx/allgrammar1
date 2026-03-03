import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { fetchContentData } from '@/lib/dashboard/queries';
import { ContentClient } from '@/app/(dashboard)/teacher/content/client';

export default async function AdminContentPage() {
  const user = await requireRole(['admin', 'boss']);
  const levels = await fetchContentData();

  return (
    <>
      <Topbar user={user} title="콘텐츠 관리" />
      <div className="p-4 md:p-6">
        <ContentClient levels={levels} />
      </div>
    </>
  );
}
