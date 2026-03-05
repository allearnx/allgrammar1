import { Topbar } from '@/components/layout/topbar';
import { NaesinAdminClient } from '@/components/dashboard/naesin-admin';
import { getNaesinPageData } from '@/lib/naesin/admin-page';

export default async function AdminNaesinPage() {
  const { user, textbooks } = await getNaesinPageData(['admin', 'boss']);
  return (
    <>
      <Topbar user={user} title="내신 관리" />
      <div className="p-4 md:p-6">
        <NaesinAdminClient textbooks={textbooks} />
      </div>
    </>
  );
}
