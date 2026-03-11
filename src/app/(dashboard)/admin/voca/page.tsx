import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { VocaAdminClient } from '@/components/dashboard/voca-admin';

export default async function AdminVocaPage() {
  const user = await requireRole(['admin']);
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
