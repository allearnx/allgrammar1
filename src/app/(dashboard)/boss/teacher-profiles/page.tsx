import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { TeacherProfilesClient } from './client';

export default async function BossTeacherProfilesPage() {
  const user = await requireUser();
  if (user.role !== 'boss' && !user.is_homepage_manager) redirect('/login');
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from('teacher_profiles')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <>
      <Topbar user={user} title="선생님 프로필 관리" />
      <div className="p-4 md:p-6">
        <TeacherProfilesClient profiles={profiles || []} />
      </div>
    </>
  );
}
