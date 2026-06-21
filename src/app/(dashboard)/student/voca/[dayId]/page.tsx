import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { VocaDayClient } from './client';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { canUseFeature } from '@/lib/billing/feature-gate';
import { isR1Complete } from '@/lib/dashboard/voca-helpers';
import type { VocaVocabulary, VocaStudentProgress, VocaDay } from '@/types/voca';
import { VOCA_DAYS_COLUMNS, VOCA_VOCABULARY_COLUMNS, VOCA_STUDENT_PROGRESS_COLUMNS } from '@/types/voca';

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
    .select('id, round2_unlocked, voca_round_mode')
    .eq('student_id', user.id)
    .eq('service', 'voca')
    .single();

  if (!assignment) redirect('/student');

  // Get day info + sort_order for free limit check
  const { data: day } = await supabase
    .from('voca_days')
    .select(VOCA_DAYS_COLUMNS)
    .eq('id', dayId)
    .single();

  if (!day) notFound();

  // 무료 플랜: Day 3개까지만 접근 가능
  const planContext = await getPlanContext(user.academy_id, user.id);
  if (planContext.tier === 'free') {
    const { count } = await supabase
      .from('voca_days')
      .select('id', { count: 'exact', head: true })
      .eq('book_id', (day as VocaDay).book_id)
      .lt('sort_order', (day as VocaDay).sort_order);
    if ((count ?? 0) >= 3) redirect('/student/voca');
  }

  // Get vocabulary
  const { data: vocabulary } = await supabase
    .from('voca_vocabulary')
    .select(VOCA_VOCABULARY_COLUMNS)
    .eq('day_id', dayId)
    .order('sort_order');

  // Get student progress for this day
  const { data: progress } = await supabase
    .from('voca_student_progress')
    .select(VOCA_STUDENT_PROGRESS_COLUMNS)
    .eq('student_id', user.id)
    .eq('day_id', dayId)
    .single();

  // 책 전체 Day의 1회독 완료 여부 판단 → 2회독 모드 결정
  const { data: allBookDays } = await supabase
    .from('voca_days')
    .select('id')
    .eq('book_id', (day as VocaDay).book_id);
  const allDayIds = (allBookDays || []).map((d) => d.id);
  const { data: allProgress } = allDayIds.length > 0
    ? await supabase
        .from('voca_student_progress')
        .select('day_id, flashcard_completed, quiz_score, spelling_score, matching_completed')
        .eq('student_id', user.id)
        .in('day_id', allDayIds)
    : { data: [] };
  const progMap = new Map((allProgress || []).map((p) => [p.day_id, p]));
  const bookRound1Complete = allDayIds.length > 0 && allDayIds.every((id) => {
    return isR1Complete((progMap.get(id) as VocaStudentProgress | undefined) ?? null);
  });

  // Get wrong words from quiz results and matching submissions
  const [{ data: quizResults }, { data: matchingSubmissions }] = await Promise.all([
    supabase
      .from('voca_quiz_results')
      .select('wrong_words')
      .eq('student_id', user.id)
      .eq('day_id', dayId),
    supabase
      .from('voca_matching_submissions')
      .select('wrong_words')
      .eq('student_id', user.id)
      .eq('day_id', dayId),
  ]);

  // 오답 단어 = 퀴즈(시험)에서 틀린 것만. 매칭/스펠링 자가수정 슬립은 제외.
  // (matchingSubmissions는 아래 hasMatchingSubmission 게이트용으로만 사용)
  const wrongWordsMap = new Map<string, { front_text: string; back_text: string }>();

  for (const row of quizResults || []) {
    const words = (row.wrong_words || []) as Array<{ front_text: string; back_text: string }>;
    for (const w of words) {
      if (w.front_text) wrongWordsMap.set(w.front_text.toLowerCase(), w);
    }
  }

  const wrongWords = Array.from(wrongWordsMap.values());
  const hasMatchingSubmission = (matchingSubmissions?.length ?? 0) > 0;

  const round2Locked = !assignment?.round2_unlocked && !canUseFeature(planContext.tier, 'voca:round2');
  const roundMode = (assignment?.voca_round_mode as 'book' | 'day') || 'book';

  let currentRound: '1' | '2' = '1';
  if (!round2Locked) {
    if (roundMode === 'day') {
      // Day별 모드: 이 Day의 1회독 완료 여부로 판단
      currentRound = isR1Complete((progress as VocaStudentProgress) ?? null) ? '2' : '1';
    } else {
      // 책 단위 모드: 전체 Day 1회독 완료 여부로 판단
      currentRound = bookRound1Complete ? '2' : '1';
    }
  }

  return (
    <>
      <Topbar user={user} title={(day as VocaDay).title} />
      <div className="p-4 md:p-6">
        <VocaDayClient
          day={day as VocaDay}
          vocabulary={(vocabulary as VocaVocabulary[]) || []}
          progress={(progress as VocaStudentProgress) || null}
          wrongWords={wrongWords}
          currentRound={currentRound}
          hasMatchingSubmission={hasMatchingSubmission}
        />
      </div>
    </>
  );
}
