import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { AnnouncementsClient } from './client';

export default async function BossAnnouncementsPage() {
  const user = await requireUser();
  if (user.role !== 'boss') redirect('/login');
  const admin = createAdminClient();

  const { data: announcements } = await admin
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <>
      <Topbar user={user} title="공지사항 관리" />
      <div className="p-4 md:p-6">
        <AnnouncementsClient announcements={announcements || []} />
      </div>
    </>
  );
}
