import { Topbar } from '@/components/layout/topbar';
import { ContentClient } from '@/components/dashboard/content-client';
import { getContentPageData } from '@/lib/dashboard/page-data';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function ContentPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const { user, levels } = await getContentPageData(allowedRoles);
  return (
    <>
      <Topbar user={user} title="콘텐츠 관리" />
      <div className="p-4 md:p-6">
        <ContentClient levels={levels} />
      </div>
    </>
  );
}
