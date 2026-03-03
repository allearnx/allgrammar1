import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinAdminClient } from '@/app/(dashboard)/teacher/naesin/client';

export default async function BossNaesinPage() {
  const user = await requireRole(['boss']);
  const supabase = await createClient();

  const { data: textbooks } = await supabase
    .from('naesin_textbooks')
    .select('*')
    .order('grade')
    .order('sort_order');

  return (
    <>
      <Topbar user={user} title="내신 관리" />
      <div className="p-4 md:p-6">
        <NaesinAdminClient textbooks={textbooks || []} />
      </div>
    </>
  );
}
