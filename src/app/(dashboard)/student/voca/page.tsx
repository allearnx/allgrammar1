import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { VocaHomeClient } from './client';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

export default async function StudentVocaPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string }>;
}) {
  const { bookId: initialBookId } = await searchParams;
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

  // 배정된 교재가 있으면 해당 교재만, 없으면 전체 교재 fetch
  const { data: bookAssignment } = await supabase
    .from('voca_book_assignments')
    .select('book_id')
    .eq('student_id', user.id)
    .single();

  const { data: books } = bookAssignment
    ? await supabase.from('voca_books').select('*').eq('id', bookAssignment.book_id)
    : await supabase.from('voca_books').select('*').order('created_at');

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
      <Topbar user={user} title="올킬보카" />
      <div className="p-4 md:p-6">
        <VocaHomeClient
          books={(books as VocaBook[]) || []}
          days={days}
          progressList={progressList}
          initialBookId={initialBookId}
        />
      </div>
    </>
  );
}
