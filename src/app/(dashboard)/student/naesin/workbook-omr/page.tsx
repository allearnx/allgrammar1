import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { WorkbookOmrClient } from '@/components/naesin/workbook-omr';
import type { NaesinWorkbook } from '@/types/naesin';

export default async function WorkbookOmrPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: workbooks } = await supabase
    .from('naesin_workbooks')
    .select('*')
    .eq('is_active', true)
    .order('grade')
    .order('sort_order');

  return (
    <>
      <Topbar user={user} title="교재 OMR" />
      <div className="p-4 md:p-6">
        <WorkbookOmrClient workbooks={(workbooks || []) as NaesinWorkbook[]} />
      </div>
    </>
  );
}
