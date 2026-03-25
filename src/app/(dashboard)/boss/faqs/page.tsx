import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { FaqsClient } from './client';

export default async function BossFaqsPage() {
  const user = await requireUser();
  if (user.role !== 'boss' && !user.is_homepage_manager) redirect('/login');
  const admin = createAdminClient();

  const { data: faqs } = await admin
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true });

  return (
    <>
      <Topbar user={user} title="FAQ 관리" />
      <div className="p-4 md:p-6">
        <FaqsClient faqs={faqs || []} />
      </div>
    </>
  );
}
