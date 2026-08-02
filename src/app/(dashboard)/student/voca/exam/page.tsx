import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { resolveFreeVocaDayLimit } from '@/lib/billing/voca-free-limit';
import { redirect } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { VocaExamClient } from './client';
import type { VocaBook, VocaDay } from '@/types/voca';
import { VOCA_BOOKS_COLUMNS, VOCA_DAYS_COLUMNS } from '@/types/voca';
import { resolveExamIntensity } from '@/lib/voca/exam-intensity';

/** 올킬시험 — 묶음 표제어 스펠링 시험 전용 페이지 (보카 홈 하단 카드에서 승격) */
export default async function VocaExamPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // 보카 홈과 동일한 접근 규칙: 배정 or 무료 체험
  const { data: assignment } = await supabase
    .from('service_assignments')
    .select('id, voca_exam_pass_score, voca_exam_seconds_per_word, voca_exam_retry_wrong')
    .eq('student_id', user.id)
    .eq('service', 'voca')
    .single();

  const plan = await getPlanContext(user.academy_id, user.id);
  if (!assignment && plan.tier !== 'free') redirect('/student');

  // 학원 기본 강도 (개인 가입은 academy_id 없음 → 시스템 기본으로 폴백)
  let academyExam = null;
  if (user.academy_id) {
    const { data } = await supabase
      .from('academies')
      .select('voca_exam_pass_score_default, voca_exam_seconds_per_word_default, voca_exam_retry_wrong_default')
      .eq('id', user.academy_id)
      .maybeSingle();
    academyExam = data;
  }
  const examIntensity = resolveExamIntensity(assignment, academyExam);

  const { data: allBooks } = await supabase
    .from('voca_books').select(VOCA_BOOKS_COLUMNS).eq('is_active', true).order('created_at');

  const freeVocaDayLimit = await resolveFreeVocaDayLimit(supabase, plan.tier, user.academy_id, user.id);
  const allBookIds = (allBooks || []).map((b) => b.id);
  let allDays: VocaDay[] = [];
  if (allBookIds.length > 0) {
    const { data } = await supabase
      .from('voca_days')
      .select(VOCA_DAYS_COLUMNS)
      .in('book_id', allBookIds)
      .order('sort_order');
    allDays = data || [];
  }

  // 시험 교재 목록 = 학생의 교재만: 배정 교재(voca_book_assignments) + 진도가 있는 교재.
  // 전체 교재를 보여주면 학생이 엉뚱한 교재의 같은 Day 번호로 시험을 보게 됨 —
  // "안 배운 단어가 시험에 나옴" 제보의 원인 (김지민: 워드마스터 학습 중인데
  // 능률고교필수 Day 21의 circuit 목격, 2026-08-02 DB 대조 확정).
  // 아직 아무 기록도 없는 학생(신규·무료 체험)만 전체 목록 폴백.
  const dayToBook = new Map(allDays.map((d) => [d.id, d.book_id]));
  const [{ data: bookAssign }, { data: progRows }] = await Promise.all([
    supabase.from('voca_book_assignments').select('book_id').eq('student_id', user.id).maybeSingle(),
    supabase
      .from('voca_student_progress')
      .select('day_id')
      .eq('student_id', user.id)
      .order('updated_at', { ascending: false }),
  ]);
  const myBookIds = new Set<string>();
  if (bookAssign?.book_id) myBookIds.add(bookAssign.book_id);
  for (const p of progRows || []) {
    const bid = dayToBook.get(p.day_id);
    if (bid) myBookIds.add(bid);
  }
  const books = myBookIds.size > 0 ? (allBooks || []).filter((b) => myBookIds.has(b.id)) : allBooks || [];
  const visibleBookIds = new Set(books.map((b) => b.id));
  const days = allDays.filter((d) => visibleBookIds.has(d.book_id));

  // 기본 교재 = 배정 교재 → 없으면 가장 최근 학습한 교재
  let defaultBookId: string | undefined = bookAssign?.book_id ?? undefined;
  if (!defaultBookId) {
    const recentDayId = progRows?.[0]?.day_id;
    if (recentDayId) defaultBookId = dayToBook.get(recentDayId);
  }

  return (
    <>
      <Topbar user={user} title="올킬시험" />
      <div className="p-4 md:p-6">
        <VocaExamClient
          books={(books as VocaBook[]) || []}
          days={days}
          studentId={user.id}
          defaultBookId={defaultBookId}
          freeDayLimit={freeVocaDayLimit}
          examIntensity={examIntensity}
        />
      </div>
    </>
  );
}
