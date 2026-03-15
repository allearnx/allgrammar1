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

  const planContext = await getPlanContext(user.academy_id, user.id);
  const round2Locked = !canUseFeature(planContext.tier, 'voca:round2');

  return (
    <>
      <Topbar user={user} title={(day as VocaDay).title} />
      <div className="p-4 md:p-6">
        <VocaDayClient
          day={day as VocaDay}
          vocabulary={(vocabulary as VocaVocabulary[]) || []}
          progress={(progress as VocaStudentProgress) || null}
          wrongWords={wrongWords}
          round2Locked={round2Locked}
        />
      </div>
    </>
  );
}
