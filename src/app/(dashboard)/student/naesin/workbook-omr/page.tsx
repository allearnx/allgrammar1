import { requireRole } from '@/lib/auth/helpers';
import { requireNaesinAccess } from '@/lib/naesin/require-naesin-access';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { WorkbookOmrClient } from '@/components/naesin/workbook-omr';
import type { NaesinWorkbook } from '@/types/naesin';

export default async function WorkbookOmrPage() {
  const user = await requireRole(['student']);
  await requireNaesinAccess(user); // 서비스 게이트 (무료 택1 포함)
  const supabase = await createClient();

  const { data: workbooks } = await supabase
    .from('naesin_workbooks')
    .select('id, title, publisher, grade, cover_image_url, sort_order, is_active, created_at')
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
