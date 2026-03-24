import { Topbar } from '@/components/layout/topbar';
import { TextbookModeClient } from '@/components/dashboard/textbook-mode-client';
import { getTextbookModePageData } from '@/lib/dashboard/page-data';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function TextbookModePage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const { user, passages } = await getTextbookModePageData(allowedRoles);
  return (
    <>
      <Topbar user={user} title="교과서 모드 관리" />
      <div className="p-4 md:p-6">
        <TextbookModeClient passages={passages} />
      </div>
    </>
  );
}
