import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { UsersClient } from './client';

export default async function BossUsersPage() {
  const user = await requireRole(['boss']);
  const admin = createAdminClient();

  const { data: users } = await admin
    .from('users')
    .select('id, full_name, email, role, academy_id, is_active, created_at')
    .order('created_at', { ascending: false });

  const { data: academies } = await admin
    .from('academies')
    .select('id, name')
    .order('name');

  return (
    <>
      <Topbar user={user} title="사용자 관리" />
      <div className="p-4 md:p-6">
        <UsersClient users={users || []} academies={academies || []} />
      </div>
    </>
  );
}
