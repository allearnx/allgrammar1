import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { VocaHomeClient } from './client';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { canUseFeature } from '@/lib/billing/feature-gate';
import { DiagnosticEntryCard } from '@/components/voca/diagnostic-entry-card';
import { isR1Complete } from '@/lib/dashboard/voca-helpers';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';
import { VOCA_BOOKS_COLUMNS, VOCA_DAYS_COLUMNS, VOCA_STUDENT_PROGRESS_COLUMNS } from '@/types/voca';

/** 서버 컴포넌트의 요청 시각 기준 판정 — 컴포넌트 본문의 Date.now()는 React 순수성 린트에 걸려 헬퍼로 분리 */
function isWithinDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() < days * 24 * 60 * 60 * 1000;
}

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
    .select('id, round2_unlocked, voca_round_mode, expires_at')
    .eq('student_id', user.id)
    .eq('service', 'voca')
    .single();

  // 무료 플랜은 배정 없어도 체험(3 Day) 접근 허용 — 내신과 왔다갔다 가능
  const planForGate = await getPlanContext(user.academy_id, user.id);
  if (!assignment && planForGate.tier !== 'free') redirect('/student');

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

  const { data: latestDiagnostic } = await supabase
    .from('voca_diagnostic_results')
    .select('final_band, final_qualifier, coverage_score, created_at')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 교재 1회독 완주 → 재진단 유도 배너. 최근 7일 내 진단했으면 다시 조르지 않는다.
  const progressByDay = new Map(progressList.map((p) => [p.day_id, p]));
  const completedBookTitles = (books || [])
    .filter((b) => {
      const bookDays = days.filter((d) => d.book_id === b.id);
      return bookDays.length > 0 && bookDays.every((d) => isR1Complete(progressByDay.get(d.id) ?? null));
    })
    .map((b) => b.title);
  const diagnosedRecently = !!latestDiagnostic && isWithinDays(latestDiagnostic.created_at, 7);
  const retestBook =
    completedBookTitles.length > 0 && !diagnosedRecently
      ? { title: completedBookTitles[0], moreCount: completedBookTitles.length - 1 }
      : null;

  const planContext = planForGate;
  const isFree = planContext.tier === 'free';
  const round2Locked = !assignment?.round2_unlocked && !canUseFeature(planContext.tier, 'voca:round2');

  return (
    <>
      <Topbar user={user} title="올킬보카" />
      <div className="p-4 md:p-6">
        <DiagnosticEntryCard latest={latestDiagnostic} retestBook={retestBook} />
        <VocaHomeClient
          books={(books as VocaBook[]) || []}
          days={days}
          progressList={progressList}
          submissionStatuses={submissionStatusMap}
          studentId={user.id}
          initialBookId={initialBookId}
          freeDayLimit={isFree ? 3 : 0}
          round2Locked={round2Locked}
          round2Forced={!!assignment?.round2_unlocked}
          roundMode={(assignment?.voca_round_mode as 'book' | 'day') || 'book'}
          firstTimeGuide={progressList.length === 0}
          expiresAt={assignment?.expires_at ?? null}
        />
      </div>
    </>
  );
}
