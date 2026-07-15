import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/helpers';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cached, TTL } from '@/lib/cache/server-cache';
import { cacheTags } from '@/lib/cache/tags';
import { Sidebar } from '@/components/layout/sidebar';
import { PaidStatusProvider } from '@/components/layout/paid-status-context';
import { PresenceTracker } from '@/components/layout/presence-tracker';
import { AnnouncementBanner } from '@/components/dashboard/announcement-banner';
import { UpdateBanner } from '@/components/layout/update-banner';
import { QueryProvider } from '@/components/providers/query-provider';
import { deriveTier } from '@/lib/billing/feature-gate';
import { isAssignmentActive } from '@/lib/billing/service-expiry';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import { groupBy } from '@/lib/naesin/build-unit-summary';
import type { NaesinStageStatuses } from '@/types/database';
import type { NaesinStudentProgress } from '@/types/naesin';
import { NAESIN_EXAM_ASSIGNMENTS_COLUMNS, PROGRESS_SUMMARY_COLUMNS } from '@/types/naesin';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export interface NaesinSidebarExam {
  round: number;
  label: string;
  examDate: string | null;
  units: {
    id: string;
    unitNumber: number;
    title: string;
    stageStatuses: NaesinStageStatuses;
  }[];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Fetch assigned services for students
  let services: string[] | undefined;
  let naesinTree: NaesinSidebarExam[] | undefined;

  let vocaPendingExams = 0;

  if (user.role === 'student') {
    services = await getCachedServices(user.id);

    // 무료 tier(개인·학원 공통): 보카·내신 둘 다 체험 가능하므로 사이드바에 두 메뉴 모두 노출.
    // 첫 화면 안내 "나머지도 사이드 메뉴에서 언제든 체험" 카피와 동작 일치.
    // (각 서비스의 무료 한도는 페이지에서 적용: 보카 3 Day, 내신 1단원·암기 3종)
    const { tier } = await getPlanContext(user.academy_id, user.id);
    if (tier === 'free') {
      services = [...new Set([...services, 'naesin', 'voca'])];
    }

    // Fetch naesin sidebar tree if student has naesin service (cached 60s)
    if (services.includes('naesin')) {
      naesinTree = (await getCachedNaesinTree(user.id)) ?? undefined;
    }

    // 올킬시험 미응시 배지 (cached 60s) — 선생님 배정 시험 중 아직 통과 못 한 것
    if (services.includes('voca')) {
      vocaPendingExams = await getCachedPendingExams(user.id);
    }
  }

  // Compute isPaid for Topbar NotificationCenter gating (cached 5min)
  const isPaid =
    user.role === 'boss' ||
    (user.academy_id
      ? await getCachedIsPaid(user.academy_id)
      : false);

  return (
    <QueryProvider>
    <PaidStatusProvider isPaid={isPaid}>
    <PresenceTracker />
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar
        user={user}
        services={services}
        naesinTree={naesinTree}
        badges={vocaPendingExams > 0 ? { '/student/voca/exam': vocaPendingExams } : undefined}
      />
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <UpdateBanner />
        {children}
        {user.role === 'student' && <AnnouncementBanner />}
      </main>
      <a
        href="http://pf.kakao.com/_iLxcLG/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE500] shadow-lg hover:shadow-xl transition-shadow"
        aria-label="카카오톡 문의"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36-.14.49-.88 3.13-.91 3.35 0 0-.02.17.09.23.1.07.23.03.23.03.3-.04 3.52-2.3 4.07-2.7.7.1 1.42.15 2.16.15 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#3C1E1E"/>
        </svg>
      </a>
    </div>
    </PaidStatusProvider>
    </QueryProvider>
  );
}

/** Cached student services — TTL 5min (SESSION). 만료된 배정은 제외 + lazy 삭제 */
const getCachedServices = cached(
  async (studentId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('service_assignments')
      .select('id, service, expires_at')
      .eq('student_id', studentId);
    const all = data ?? [];
    const expired = all.filter((a) => !isAssignmentActive(a));
    if (expired.length > 0) {
      await admin.from('service_assignments').delete().in('id', expired.map((a) => a.id));
    }
    return all.filter((a) => isAssignmentActive(a)).map((d) => d.service);
  },
  'student-services',
  TTL.SESSION,
  (studentId) => [cacheTags.studentServices(studentId)],
);

/** Cached isPaid check — TTL 5min (SESSION) */
const getCachedIsPaid = cached(
  async (academyId: string) => {
    const admin = createAdminClient();
    const { data: sub } = await admin
      .from('subscriptions')
      .select('status, tier')
      .eq('academy_id', academyId)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return deriveTier(sub) !== 'free';
  },
  'is-paid',
  TTL.SESSION,
  (academyId) => [cacheTags.isPaid(academyId)],
);

/**
 * Cached 올킬시험 미응시 개수 — TTL 60s (LIVE).
 * 미응시 = 선생님 배정 시험 중 결과가 없거나 최고점이 90점 미만인 것.
 */
const getCachedPendingExams = cached(
  async (studentId: string) => {
    const admin = createAdminClient();
    const { data: asgs } = await admin
      .from('voca_exam_assignments')
      .select('id')
      .eq('student_id', studentId);
    if (!asgs || asgs.length === 0) return 0;
    const { data: results } = await admin
      .from('voca_exam_results')
      .select('assignment_id, score')
      .eq('student_id', studentId)
      .in('assignment_id', asgs.map((a) => a.id));
    const passed = new Set(
      (results ?? []).filter((r) => (r.score ?? 0) >= 90).map((r) => r.assignment_id),
    );
    return asgs.filter((a) => !passed.has(a.id)).length;
  },
  'voca-pending-exams',
  TTL.LIVE,
);

/** Cached naesin sidebar tree — TTL 60s (LIVE) */
const getCachedNaesinTree = cached(
  async (studentId: string) => {
    const admin = createAdminClient();
    return (await fetchNaesinTree(admin, studentId)) ?? null;
  },
  'naesin-sidebar',
  TTL.LIVE,
  (studentId) => [cacheTags.naesinSidebar(studentId)],
);

type SupabaseClient = Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>;

async function fetchNaesinTree(
  supabase: SupabaseClient,
  studentId: string
): Promise<NaesinSidebarExam[] | undefined> {
  // Get student textbook setting + academy's naesin_required_rounds
  const [{ data: setting }, { data: studentRow }] = await Promise.all([
    supabase
      .from('naesin_student_settings')
      .select('textbook_id')
      .eq('student_id', studentId)
      .single(),
    supabase
      .from('users')
      .select('academy_id')
      .eq('id', studentId)
      .single(),
  ]);

  if (!setting?.textbook_id) return undefined;

  let naesinRequiredRounds = 1;
  if (studentRow?.academy_id) {
    const { data: academy } = await supabase
      .from('academies')
      .select('naesin_required_rounds')
      .eq('id', studentRow.academy_id)
      .single();
    naesinRequiredRounds = academy?.naesin_required_rounds ?? 1;
  }

  // Batch 1: assignments + units (need unit IDs first to filter the rest)
  const [assignmentsRes, unitsRes] = await Promise.all([
    supabase
      .from('naesin_exam_assignments')
      .select(NAESIN_EXAM_ASSIGNMENTS_COLUMNS)
      .eq('student_id', studentId)
      .eq('textbook_id', setting.textbook_id)
      .order('exam_round'),
    supabase
      .from('naesin_units')
      .select('id, unit_number, title, sort_order')
      .eq('textbook_id', setting.textbook_id)
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  const assignments = assignmentsRes.data || [];
  const units = unitsRes.data || [];

  if (assignments.length === 0 || units.length === 0) return undefined;

  // Batch 2: content queries filtered by unitIds to avoid full table scans
  const unitIds = units.map((u) => u.id);
  const [progressRes, vocabRes, passageRes, dialogueRes, grammarRes, problemRes, lastReviewSheetRes, similarRes, reviewContentRes, quizSetsRes, mockExamRes] = await Promise.all([
    supabase
      .from('naesin_student_progress')
      .select(PROGRESS_SUMMARY_COLUMNS)
      .eq('student_id', studentId)
      .in('unit_id', unitIds),
    supabase
      .from('naesin_vocabulary')
      .select('unit_id')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_passages')
      .select('unit_id')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_dialogues')
      .select('unit_id')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_grammar_lessons')
      .select('id, unit_id, content_type')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_problem_sheets')
      .select('unit_id')
      .eq('category', 'problem')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_problem_sheets')
      .select('unit_id')
      .eq('category', 'last_review')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_similar_problems')
      .select('unit_id')
      .eq('status', 'approved')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_last_review_content')
      .select('unit_id')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_vocab_quiz_sets')
      .select('id, unit_id')
      .in('unit_id', unitIds),
    supabase
      .from('naesin_problem_sheets')
      .select('unit_id')
      .eq('category', 'mock_exam')
      .in('unit_id', unitIds),
  ]);

  // Build lookup maps
  const progressMap = new Map((progressRes.data || []).map((p) => [p.unit_id, p as NaesinStudentProgress]));
  const vocabUnitIds = new Set((vocabRes.data || []).map((r) => r.unit_id));
  const passageUnitIds = new Set((passageRes.data || []).map((r) => r.unit_id));
  const dialogueUnitIds = new Set((dialogueRes.data || []).map((r) => r.unit_id));
  const grammarByUnit = groupBy(grammarRes.data || [], 'unit_id');
  const problemUnitIds = new Set((problemRes.data || []).map((r) => r.unit_id));
  const mockExamUnitIds = new Set((mockExamRes.data || []).map((r) => r.unit_id));
  const lastReviewSheetUnitIds = new Set((lastReviewSheetRes.data || []).map((r) => r.unit_id));
  const similarUnitIds = new Set((similarRes.data || []).map((r) => r.unit_id));
  const reviewContentUnitIds = new Set((reviewContentRes.data || []).map((r) => r.unit_id));
  const quizSetsByUnit = groupBy(quizSetsRes.data || [], 'unit_id');
  const unitMap = new Map(units.map((u) => [u.id, u]));

  return assignments.map((a) => ({
    round: a.exam_round,
    label: a.exam_label || `${a.exam_round}차 시험`,
    examDate: a.exam_date,
    units: (a.unit_ids as string[])
      .map((uid) => unitMap.get(uid))
      .filter(Boolean)
      .map((u) => {
        const unitGrammar = grammarByUnit[u!.id] || [];
        const videoLessons = unitGrammar.filter((l: { content_type: string }) => l.content_type === 'video');
        const unitQuizSets = quizSetsByUnit[u!.id] || [];
        const hasLastReview = lastReviewSheetUnitIds.has(u!.id) || similarUnitIds.has(u!.id) || reviewContentUnitIds.has(u!.id);

        const stageStatuses = calculateStageStatuses({
          progress: progressMap.get(u!.id) || null,
          content: {
            hasVocab: vocabUnitIds.has(u!.id),
            hasPassage: passageUnitIds.has(u!.id),
            hasDialogue: dialogueUnitIds.has(u!.id),
            hasTextbookVideo: false,
            hasGrammar: unitGrammar.length > 0,
            hasProblem: problemUnitIds.has(u!.id),
            hasMockExam: mockExamUnitIds.has(u!.id),
            hasLastReview: hasLastReview || !!a.exam_date,
          },
          vocabQuizSetCount: unitQuizSets.length,
          grammarVideoCount: videoLessons.length,
          examDate: a.exam_date,
          naesinRequiredRounds,
        });

        return {
          id: u!.id,
          unitNumber: u!.unit_number,
          title: u!.title,
          stageStatuses,
        };
      }),
  }));
}

