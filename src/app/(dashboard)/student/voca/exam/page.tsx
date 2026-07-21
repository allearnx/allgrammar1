import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
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

  return (
    <>
      <Topbar user={user} title="올킬시험" />
      <div className="p-4 md:p-6">
        <VocaExamClient
          books={(books as VocaBook[]) || []}
          days={days}
          studentId={user.id}
          freeDayLimit={plan.tier === 'free' ? 3 : 0}
          examIntensity={examIntensity}
        />
      </div>
    </>
  );
}
