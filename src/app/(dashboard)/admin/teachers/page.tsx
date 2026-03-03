import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { TeachersClient } from './client';

export default async function AdminTeachersPage() {
  const user = await requireRole(['admin', 'boss']);
  const admin = createAdminClient();

  const { data: teachers } = await admin
    .from('users')
    .select('id, full_name, email, is_active, created_at')
    .eq('role', 'teacher')
    .eq('academy_id', user.academy_id!)
    .order('full_name');

  return (
    <>
      <Topbar user={user} title="선생님 관리" />
      <div className="p-4 md:p-6">
        <TeachersClient teachers={teachers || []} />
      </div>
    </>
  );
}
