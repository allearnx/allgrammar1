import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { WrongAnswersClient } from './client';

export default async function WrongAnswersPage() {
  const user = await requireRole(['student']);

  return (
    <>
      <Topbar user={user} title="오답모음" />
      <div className="p-4 md:p-6">
        <WrongAnswersClient />
      </div>
    </>
  );
}
