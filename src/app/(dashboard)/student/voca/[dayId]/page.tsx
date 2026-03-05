import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { VocaDayClient } from './client';
import type { VocaVocabulary, VocaStudentProgress, VocaDay } from '@/types/voca';

export default async function StudentVocaDayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Check service assignment
  const { data: assignment } = await supabase
    .from('service_assignments')
    .select('id')
    .eq('student_id', user.id)
    .eq('service', 'voca')
    .single();

  if (!assignment) redirect('/student');

  // Get day info
  const { data: day } = await supabase
    .from('voca_days')
    .select('*')
    .eq('id', dayId)
    .single();

  if (!day) notFound();

  // Get vocabulary
  const { data: vocabulary } = await supabase
    .from('voca_vocabulary')
    .select('*')
    .eq('day_id', dayId)
    .order('sort_order');

  // Get student progress
  const { data: progress } = await supabase
    .from('voca_student_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('day_id', dayId)
    .single();

  return (
    <>
      <Topbar user={user} title={(day as VocaDay).title} />
      <div className="p-4 md:p-6">
        <VocaDayClient
          day={day as VocaDay}
          vocabulary={(vocabulary as VocaVocabulary[]) || []}
          progress={(progress as VocaStudentProgress) || null}
        />
      </div>
    </>
  );
}
