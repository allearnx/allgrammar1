import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { VocaAdminClient } from '@/components/dashboard/voca-admin';
import { getRoleConfig } from '@/lib/auth/role-page-config';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function VocaPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const user = await requireRole(allowedRoles);
  const supabase = await createClient();

  const { data: books } = await supabase
    .from('voca_books')
    .select('*')
    .order('sort_order');

  return (
    <>
      <Topbar user={user} title="올킬보카 관리" />
      <div className="p-4 md:p-6">
        <VocaAdminClient books={books || []} />
      </div>
    </>
  );
}
