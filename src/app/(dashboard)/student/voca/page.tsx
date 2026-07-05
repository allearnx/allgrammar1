import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { VocaHomeClient } from './client';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { canUseFeature, isServiceAllowed } from '@/lib/billing/feature-gate';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';
import { VOCA_BOOKS_COLUMNS, VOCA_DAYS_COLUMNS, VOCA_STUDENT_PROGRESS_COLUMNS } from '@/types/voca';

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
    .select('id, round2_unlocked, voca_round_mode')
    .eq('student_id', user.id)
    .eq('service', 'voca')
    .single();

  if (!assignment) redirect('/student');

  // 전체 교재 자유 선택
  const { data: books } = await supabase
    .from('voca_books').select(VOCA_BOOKS_COLUMNS).eq('is_active', true).order('created_at');

  const bookIds = (books || []).map((b) => b.id);
  let days: VocaDay[] = [];
  if (bookIds.length > 0) {
    const { data } = await supabase
      .from('voca_days')
      .select(VOCA_DAYS_COLUMNS)
      .in('book_id', bookIds)
      .order('sort_order');
    days = data || [];
  }

  // Get student progress + submission statuses for all days
  const dayIds = days.map((d) => d.id);
  let progressList: VocaStudentProgress[] = [];
  const submissionStatusMap: Record<string, string> = {};
  if (dayIds.length > 0) {
    const [{ data }, { data: submissions }] = await Promise.all([
      supabase
        .from('voca_student_progress')
        .select(VOCA_STUDENT_PROGRESS_COLUMNS)
        .eq('student_id', user.id)
        .in('day_id', dayIds),
      supabase
        .from('voca_matching_submissions')
        .select('day_id, status')
        .eq('student_id', user.id)
        .in('day_id', dayIds),
    ]);
    progressList = data || [];
    for (const s of submissions || []) submissionStatusMap[s.day_id] = s.status;
  }

  const planContext = await getPlanContext(user.academy_id, user.id);
  // 무료 택1: 내신을 선택한 학생이 보카 URL로 직접 접근하는 것 차단
  if (!isServiceAllowed(planContext.tier, planContext.freeService, 'voca')) redirect('/student');
  const isFree = planContext.tier === 'free';
  const round2Locked = !assignment?.round2_unlocked && !canUseFeature(planContext.tier, 'voca:round2');

  return (
    <>
      <Topbar user={user} title="올킬보카" />
      <div className="p-4 md:p-6">
        <VocaHomeClient
          books={(books as VocaBook[]) || []}
          days={days}
          progressList={progressList}
          submissionStatuses={submissionStatusMap}
          initialBookId={initialBookId}
          freeDayLimit={isFree ? 3 : 0}
          round2Locked={round2Locked}
          roundMode={(assignment?.voca_round_mode as 'book' | 'day') || 'book'}
          firstTimeGuide={progressList.length === 0}
        />
      </div>
    </>
  );
}
