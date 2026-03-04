import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { fetchTextbookData } from '@/lib/dashboard/queries';
import { TextbookModeClient } from '@/components/dashboard/textbook-mode-client';

export default async function BossTextbookModePage() {
  const user = await requireRole(['boss']);
  const passages = await fetchTextbookData();

  return (
    <>
      <Topbar user={user} title="교과서 모드 관리" />
      <div className="p-4 md:p-6">
        <TextbookModeClient passages={passages} />
      </div>
    </>
  );
}
