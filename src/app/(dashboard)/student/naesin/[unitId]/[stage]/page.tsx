import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound, redirect } from 'next/navigation';
import { NaesinStageView } from './client';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { NaesinContentAvailability } from '@/types/database';

const VALID_STAGES = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const;
type StageKey = (typeof VALID_STAGES)[number];

interface Props {
  params: Promise<{ unitId: string; stage: string }>;
}

export default async function NaesinStagePage({ params }: Props) {
  const { unitId, stage } = await params;

  if (!VALID_STAGES.includes(stage as StageKey)) {
    notFound();
  }
  const stageKey = stage as StageKey;

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

  // Common queries: progress + content availability + exam date
  const [
    progressRes,
    vocabCountRes,
    passageCountRes,
    grammarRes,
    problemCountRes,
    lastReviewSheetCountRes,
    similarProblemCountRes,
    reviewContentCountRes,
    examDateRes,
    quizSetsRes,
  ] = await Promise.all([
    supabase
      .from('naesin_student_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single(),
    supabase.from('naesin_vocabulary').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
    supabase.from('naesin_passages').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
    supabase.from('naesin_grammar_lessons').select('id, content_type').eq('unit_id', unitId),
    supabase.from('naesin_problem_sheets').select('id', { count: 'exact', head: true }).eq('unit_id', unitId).eq('category', 'problem'),
    supabase.from('naesin_problem_sheets').select('id', { count: 'exact', head: true }).eq('unit_id', unitId).eq('category', 'last_review'),
    supabase.from('naesin_similar_problems').select('id', { count: 'exact', head: true }).eq('unit_id', unitId).eq('status', 'approved'),
    supabase.from('naesin_last_review_content').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
    textbookId
      ? supabase
          .from('naesin_exam_dates')
          .select('exam_date')
          .eq('student_id', user.id)
          .eq('textbook_id', textbookId)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from('naesin_vocab_quiz_sets').select('id').eq('unit_id', unitId),
  ]);

  const progress = progressRes.data;
  const grammarLessonsAll = grammarRes.data || [];
  const videoLessons = grammarLessonsAll.filter((l) => l.content_type === 'video');
  const quizSets = quizSetsRes.data || [];
  const examDate = examDateRes.data?.exam_date || null;

  const hasLastReviewContent =
    (lastReviewSheetCountRes.count ?? 0) > 0 ||
    (similarProblemCountRes.count ?? 0) > 0 ||
    (reviewContentCountRes.count ?? 0) > 0;

  const contentAvailability: NaesinContentAvailability = {
    hasVocab: (vocabCountRes.count ?? 0) > 0,
    hasPassage: (passageCountRes.count ?? 0) > 0,
    hasGrammar: grammarLessonsAll.length > 0,
    hasProblem: (problemCountRes.count ?? 0) > 0,
    hasLastReview: hasLastReviewContent || !!examDate,
  };

  const stageStatuses = calculateStageStatuses({
    progress,
    content: contentAvailability,
    vocabQuizSetCount: quizSets.length,
    grammarVideoCount: videoLessons.length,
    examDate,
  });

  // If the requested stage is locked, redirect to overview
  if (stageStatuses[stageKey] === 'locked') {
    redirect('/student/naesin');
  }

  // Fetch stage-specific content
  const stageData = await fetchStageData(supabase, user.id, unitId, stageKey, quizSets.map((s) => s.id));

  return (
    <>
      <Topbar user={user} title={unit.title} />
      <div className="p-4 md:p-6">
        <NaesinStageView
          unit={{ id: unit.id, unit_number: unit.unit_number, title: unit.title }}
          currentStage={stageKey}
          stageStatuses={stageStatuses}
          stageData={stageData}
          examDate={examDate}
        />
      </div>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

async function fetchStageData(
  supabase: SupabaseClient,
  userId: string,
  unitId: string,
  stage: StageKey,
  quizSetIds: string[]
) {
  switch (stage) {
    case 'vocab': {
      const [vocabRes, quizSetsRes, quizSetResultsRes] = await Promise.all([
        supabase.from('naesin_vocabulary').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_vocab_quiz_sets').select('*').eq('unit_id', unitId).order('set_order'),
        supabase.from('naesin_vocab_quiz_set_results').select('quiz_set_id, score').eq('student_id', userId),
      ]);

      const allResults = quizSetResultsRes.data || [];
      const completedSetIds: string[] = [];
      for (const setId of quizSetIds) {
        const results = allResults.filter((r: { quiz_set_id: string; score: number }) => r.quiz_set_id === setId);
        const bestScore = Math.max(0, ...results.map((r: { score: number }) => r.score));
        if (bestScore >= 80) completedSetIds.push(setId);
      }

      return {
        vocabulary: vocabRes.data || [],
        quizSets: quizSetsRes.data || [],
        completedSetIds,
      };
    }

    case 'passage': {
      const passageRes = await supabase
        .from('naesin_passages')
        .select('*')
        .eq('unit_id', unitId)
        .order('sort_order');
      return { passages: passageRes.data || [] };
    }

    case 'grammar': {
      const [grammarRes, videoProgressRes] = await Promise.all([
        supabase.from('naesin_grammar_lessons').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_grammar_video_progress').select('*').eq('student_id', userId),
      ]);

      const grammarLessons = grammarRes.data || [];
      const lessonIds = grammarLessons.map((l: { id: string }) => l.id);
      const videoProgress = (videoProgressRes.data || []).filter(
        (vp: { lesson_id: string }) => lessonIds.includes(vp.lesson_id)
      );

      return { grammarLessons, videoProgress };
    }

    case 'problem': {
      const problemRes = await supabase
        .from('naesin_problem_sheets')
        .select('*')
        .eq('unit_id', unitId)
        .eq('category', 'problem')
        .order('sort_order');
      return { problemSheets: problemRes.data || [] };
    }

    case 'lastReview': {
      const [sheetsRes, similarRes, contentRes] = await Promise.all([
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
      ]);
      return {
        lastReviewProblemSheets: sheetsRes.data || [],
        similarProblems: similarRes.data || [],
        reviewContent: contentRes.data || [],
      };
    }
  }
}
