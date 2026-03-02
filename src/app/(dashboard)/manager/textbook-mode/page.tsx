import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { TextbookModeClient } from './client';

export default async function TextbookModePage() {
  const user = await requireRole(['manager', 'admin', 'super_admin']);
  const supabase = await createClient();

  const { data: passages } = await supabase
    .from('textbook_passages')
    .select('*, grammar:grammars(title, level:levels(level_number, title_ko))')
    .order('created_at', { ascending: false });

  return (
    <>
      <Topbar user={user} title="교과서 모드 관리" />
      <div className="p-4 md:p-6">
        <TextbookModeClient passages={passages || []} />
      </div>
    </>
  );
}
