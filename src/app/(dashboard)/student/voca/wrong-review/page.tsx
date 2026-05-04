import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { WrongReviewClient } from '@/components/voca/wrong-review-client';

export default async function WrongReviewPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Check voca service assignment
  const { data: assignment } = await supabase
    .from('service_assignments')
    .select('id')
    .eq('student_id', user.id)
    .eq('service', 'voca')
    .single();

  if (!assignment) redirect('/student');

  return (
    <>
      <Topbar user={user} title="올킬오답" />
      <div className="p-4 md:p-6">
        <WrongReviewClient />
      </div>
    </>
  );
}
