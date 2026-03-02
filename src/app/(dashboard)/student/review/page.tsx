import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { format } from 'date-fns';
import { ReviewClient } from './client';

export default async function ReviewPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: dueItems } = await supabase
    .from('student_memory_progress')
    .select('*, memory_item:memory_items(*, grammar:grammars(title))')
    .eq('student_id', user.id)
    .eq('is_mastered', false)
    .lte('next_review_date', today)
    .order('next_review_date')
    .limit(50);

  return (
    <>
      <Topbar user={user} title="복습하기" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <ReviewClient items={dueItems || []} />
      </div>
    </>
  );
}
