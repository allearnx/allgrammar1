import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { VocaHomeClient } from './client';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

export default async function StudentVocaPage() {
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

  // Get active books
  const { data: books } = await supabase
    .from('voca_books')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  // Get all days for these books
  const bookIds = (books || []).map((b) => b.id);
  let days: VocaDay[] = [];
  if (bookIds.length > 0) {
    const { data } = await supabase
      .from('voca_days')
      .select('*')
      .in('book_id', bookIds)
      .order('sort_order');
    days = data || [];
  }

  // Get student progress for all days
  const dayIds = days.map((d) => d.id);
  let progressList: VocaStudentProgress[] = [];
  if (dayIds.length > 0) {
    const { data } = await supabase
      .from('voca_student_progress')
      .select('*')
      .eq('student_id', user.id)
      .in('day_id', dayIds);
    progressList = data || [];
  }

  return (
    <>
      <Topbar user={user} title="올톡보카" />
      <div className="p-4 md:p-6">
        <VocaHomeClient
          books={(books as VocaBook[]) || []}
          days={days}
          progressList={progressList}
        />
      </div>
    </>
  );
}
