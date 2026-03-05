import { Topbar } from '@/components/layout/topbar';
import { TextbookModeClient } from '@/components/dashboard/textbook-mode-client';
import { getTextbookModePageData } from '@/lib/dashboard/page-data';

export default async function TeacherTextbookModePage() {
  const { user, passages } = await getTextbookModePageData(['teacher', 'admin', 'boss']);
  return (
    <>
      <Topbar user={user} title="교과서 모드 관리" />
      <div className="p-4 md:p-6">
        <TextbookModeClient passages={passages} />
      </div>
    </>
  );
}
