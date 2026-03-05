import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound } from 'next/navigation';
import { NaesinUnitDetail } from './client';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { NaesinContentAvailability } from '@/types/database';

interface Props {
  params: Promise<{ unitId: string }>;
}

export default async function NaesinUnitPage({ params }: Props) {
  const { unitId } = await params;
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Fetch unit info
  const { data: unit } = await supabase
    .from('naesin_units')
    .select('*, textbook:naesin_textbooks(id, display_name)')
    .eq('id', unitId)
    .single();

  if (!unit) notFound();

  const textbookId = (unit.textbook as { id: string; display_name: string } | null)?.id;

  // Fetch all content and progress in parallel
  const [
    vocabRes,
    passageRes,
    grammarRes,
    progressRes,
    quizSetsRes,
    videoProgressRes,
    problemSheetsRes,
    lastReviewProblemSheetsRes,
    similarProblemsRes,
    reviewContentRes,
    examDateRes,
    quizSetResultsRes,
  ] = await Promise.all([
    supabase
      .from('naesin_vocabulary')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'),
    supabase
      .from('naesin_passages')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'),
    supabase
      .from('naesin_grammar_lessons')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'),
    supabase
      .from('naesin_student_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single(),
    supabase
      .from('naesin_vocab_quiz_sets')
      .select('*')
      .eq('unit_id', unitId)
      .order('set_order'),
    supabase
      .from('naesin_grammar_video_progress')
      .select('*')
      .eq('student_id', user.id),
    supabase
      .from('naesin_problem_sheets')
      .select('*')
      .eq('unit_id', unitId)
      .eq('category', 'problem')
      .order('sort_order'),
    supabase
      .from('naesin_problem_sheets')
      .select('*')
      .eq('unit_id', unitId)
      .eq('category', 'last_review')
      .order('sort_order'),
    supabase
      .from('naesin_similar_problems')
      .select('*')
      .eq('unit_id', unitId)
      .eq('status', 'approved'),
    supabase
      .from('naesin_last_review_content')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'),
    textbookId
      ? supabase
          .from('naesin_exam_dates')
          .select('exam_date')
          .eq('student_id', user.id)
          .eq('textbook_id', textbookId)
          .single()
      : Promise.resolve({ data: null }),
    // Get completed quiz set IDs
    supabase
      .from('naesin_vocab_quiz_set_results')
      .select('quiz_set_id, score')
      .eq('student_id', user.id),
  ]);

  const vocabulary = vocabRes.data || [];
  const passages = passageRes.data || [];
  const grammarLessons = grammarRes.data || [];
  const progress = progressRes.data;
  const quizSets = quizSetsRes.data || [];
  const videoProgress = videoProgressRes.data || [];
  const problemSheets = problemSheetsRes.data || [];
  const lastReviewProblemSheets = lastReviewProblemSheetsRes.data || [];
  const similarProblems = similarProblemsRes.data || [];
  const reviewContent = reviewContentRes.data || [];
  const examDate = examDateRes.data?.exam_date || null;

  // Filter video progress to this unit's lessons
  const lessonIds = grammarLessons.map((l) => l.id);
  const unitVideoProgress = videoProgress.filter((vp) =>
    lessonIds.includes(vp.lesson_id)
  );

  // Compute completed quiz set IDs (best score >= 80%)
  const quizSetResults = quizSetResultsRes.data || [];
  const quizSetIds = quizSets.map((s) => s.id);
  const completedSetIds: string[] = [];
  for (const setId of quizSetIds) {
    const results = quizSetResults.filter((r) => r.quiz_set_id === setId);
    const bestScore = Math.max(0, ...results.map((r) => r.score));
    if (bestScore >= 80) completedSetIds.push(setId);
  }

  // Determine content availability with new stages
  const hasLastReviewContent =
    lastReviewProblemSheets.length > 0 ||
    similarProblems.length > 0 ||
    reviewContent.length > 0;

  const contentAvailability: NaesinContentAvailability = {
    hasVocab: vocabulary.length > 0,
    hasPassage: passages.length > 0,
    hasGrammar: grammarLessons.length > 0,
    hasProblem: problemSheets.length > 0,
    hasLastReview: hasLastReviewContent || !!examDate,
  };

  const videoLessons = grammarLessons.filter((l) => l.content_type === 'video');

  const stageStatuses = calculateStageStatuses({
    progress,
    content: contentAvailability,
    vocabQuizSetCount: quizSets.length,
    grammarVideoCount: videoLessons.length,
    examDate,
  });

  const textbookName = (unit.textbook as { id: string; display_name: string } | null)?.display_name || '';

  return (
    <>
      <Topbar user={user} title={`${textbookName} - ${unit.title}`} />
      <div className="p-4 md:p-6">
        <NaesinUnitDetail
          unit={{ id: unit.id, unit_number: unit.unit_number, title: unit.title }}
          vocabulary={vocabulary}
          passages={passages}
          grammarLessons={grammarLessons}
          stageStatuses={stageStatuses}
          quizSets={quizSets}
          completedSetIds={completedSetIds}
          videoProgress={unitVideoProgress}
          problemSheets={problemSheets}
          lastReviewProblemSheets={lastReviewProblemSheets}
          similarProblems={similarProblems}
          reviewContent={reviewContent}
          examDate={examDate}
        />
      </div>
    </>
  );
}
