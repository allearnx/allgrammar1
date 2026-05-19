import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { VocaDayClient } from './client';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { canUseFeature } from '@/lib/billing/feature-gate';
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
    .select('id, round2_unlocked')
    .eq('student_id', user.id)
    .eq('service', 'voca')
    .single();

  if (!assignment) redirect('/student');

  // Get day info + sort_order for free limit check
  const { data: day } = await supabase
    .from('voca_days')
    .select('*')
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
    .select('*')
    .eq('day_id', dayId)
    .order('sort_order');

  // Get student progress for this day
  const { data: progress } = await supabase
    .from('voca_student_progress')
    .select('*')
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
    const p = progMap.get(id);
    if (!p) return false;
    return p.flashcard_completed && (p.quiz_score ?? 0) >= 80 && (p.spelling_score ?? 0) >= 80 && p.matching_completed;
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

  // Merge wrong words from both sources, deduplicate by front_text
  const wrongWordsMap = new Map<string, { front_text: string; back_text: string }>();

  for (const row of quizResults || []) {
    const words = (row.wrong_words || []) as Array<{ front_text: string; back_text: string }>;
    for (const w of words) {
      if (w.front_text) wrongWordsMap.set(w.front_text.toLowerCase(), w);
    }
  }

  for (const row of matchingSubmissions || []) {
    const words = (row.wrong_words || []) as Array<{ word: string; match: string; type: string }>;
    for (const w of words) {
      if (w.word && !wrongWordsMap.has(w.word.toLowerCase())) {
        wrongWordsMap.set(w.word.toLowerCase(), { front_text: w.word, back_text: w.match });
      }
    }
  }

  const wrongWords = Array.from(wrongWordsMap.values());
  const hasMatchingSubmission = (matchingSubmissions?.length ?? 0) > 0;

  const round2Locked = !assignment?.round2_unlocked && !canUseFeature(planContext.tier, 'voca:round2');
  const currentRound: '1' | '2' = (!round2Locked && bookRound1Complete) ? '2' : '1';

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
