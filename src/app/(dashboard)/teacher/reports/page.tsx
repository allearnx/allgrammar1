import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { ReportsClient } from './client';

export default async function ReportsPage() {
  const user = await requireRole(['teacher', 'admin', 'boss']);
  const supabase = await createClient();

  const query = supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'student')
    .order('full_name');

  if (user.role !== 'boss' && user.academy_id) {
    query.eq('academy_id', user.academy_id);
  }

  const { data: students } = await query;

  return (
    <>
      <Topbar user={user} title="리포트" />
      <div className="p-4 md:p-6">
        <ReportsClient students={students || []} />
      </div>
    </>
  );
}
