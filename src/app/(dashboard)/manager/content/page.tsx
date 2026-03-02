import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { ContentClient } from './client';

export default async function ContentPage() {
  const user = await requireRole(['manager', 'admin', 'super_admin']);
  const supabase = await createClient();

  const { data: levels } = await supabase
    .from('levels')
    .select('*, grammars(*, memory_items(count), textbook_passages(count))')
    .order('level_number');

  return (
    <>
      <Topbar user={user} title="콘텐츠 관리" />
      <div className="p-4 md:p-6">
        <ContentClient levels={levels || []} />
      </div>
    </>
  );
}
