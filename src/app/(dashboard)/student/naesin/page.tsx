import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinHome } from './client';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';

export default async function NaesinPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Get student's textbook setting
  const { data: setting } = await supabase
    .from('naesin_student_settings')
    .select('*, textbook:naesin_textbooks(*)')
    .eq('student_id', user.id)
    .single();

  // Get all active textbooks
  const { data: textbooks } = await supabase
    .from('naesin_textbooks')
    .select('*')
    .eq('is_active', true)
    .order('grade')
    .order('sort_order');

  // Get exam date if textbook selected
  let examDate: string | null = null;
  if (setting?.textbook_id) {
    const { data: examDateData } = await supabase
      .from('naesin_exam_dates')
      .select('exam_date')
      .eq('student_id', user.id)
      .eq('textbook_id', setting.textbook_id)
      .single();
    examDate = examDateData?.exam_date || null;
  }

  // If student has a textbook selected, get the units with full detail data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let unitDetails: any[] = [];

  if (setting?.textbook_id) {
    const { data: rawUnits } = await supabase
      .from('naesin_units')
      .select('id, unit_number, title, sort_order')
      .eq('textbook_id', setting.textbook_id)
      .eq('is_active', true)
      .order('sort_order');

    if (rawUnits && rawUnits.length > 0) {
      const unitIds = rawUnits.map((u) => u.id);

      // Fetch all content for all units in parallel (batched)
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
        quizSetResultsRes,
      ] = await Promise.all([
        supabase.from('naesin_vocabulary').select('*').in('unit_id', unitIds).order('sort_order'),
        supabase.from('naesin_passages').select('*').in('unit_id', unitIds).order('sort_order'),
        supabase.from('naesin_grammar_lessons').select('*').in('unit_id', unitIds).order('sort_order'),
        supabase.from('naesin_student_progress').select('*').eq('student_id', user.id).in('unit_id', unitIds),
        supabase.from('naesin_vocab_quiz_sets').select('*').in('unit_id', unitIds).order('set_order'),
        supabase.from('naesin_grammar_video_progress').select('*').eq('student_id', user.id),
        supabase.from('naesin_problem_sheets').select('*').eq('category', 'problem').in('unit_id', unitIds).order('sort_order'),
        supabase.from('naesin_problem_sheets').select('*').eq('category', 'last_review').in('unit_id', unitIds).order('sort_order'),
        supabase.from('naesin_similar_problems').select('*').in('unit_id', unitIds).eq('status', 'approved'),
        supabase.from('naesin_last_review_content').select('*').in('unit_id', unitIds).order('sort_order'),
        supabase.from('naesin_vocab_quiz_set_results').select('quiz_set_id, score').eq('student_id', user.id),
      ]);

      // Group data by unit_id
      const vocabByUnit = groupBy(vocabRes.data || [], 'unit_id');
      const passageByUnit = groupBy(passageRes.data || [], 'unit_id');
      const grammarByUnit = groupBy(grammarRes.data || [], 'unit_id');
      const progressMap = new Map((progressRes.data || []).map((p) => [p.unit_id, p]));
      const quizSetsByUnit = groupBy(quizSetsRes.data || [], 'unit_id');
      const problemSheetsByUnit = groupBy(problemSheetsRes.data || [], 'unit_id');
      const lastReviewSheetsByUnit = groupBy(lastReviewProblemSheetsRes.data || [], 'unit_id');
      const similarProblemsByUnit = groupBy(similarProblemsRes.data || [], 'unit_id');
      const reviewContentByUnit = groupBy(reviewContentRes.data || [], 'unit_id');
      const allVideoProgress = videoProgressRes.data || [];
      const allQuizSetResults = quizSetResultsRes.data || [];

      unitDetails = rawUnits.map((u) => {
        const unitVocab = vocabByUnit[u.id] || [];
        const unitPassages = passageByUnit[u.id] || [];
        const unitGrammar = grammarByUnit[u.id] || [];
        const unitProgress = progressMap.get(u.id) || null;
        const unitQuizSets = quizSetsByUnit[u.id] || [];
        const unitProblemSheets = problemSheetsByUnit[u.id] || [];
        const unitLastReviewSheets = lastReviewSheetsByUnit[u.id] || [];
        const unitSimilarProblems = similarProblemsByUnit[u.id] || [];
        const unitReviewContent = reviewContentByUnit[u.id] || [];

        // Filter video progress to this unit's lessons
        const lessonIds = unitGrammar.map((l: { id: string }) => l.id);
        const unitVideoProgress = allVideoProgress.filter((vp: { lesson_id: string }) =>
          lessonIds.includes(vp.lesson_id)
        );

        // Compute completed quiz set IDs (best score >= 80%)
        const quizSetIds = unitQuizSets.map((s: { id: string }) => s.id);
        const completedSetIds: string[] = [];
        for (const setId of quizSetIds) {
          const results = allQuizSetResults.filter((r) => r.quiz_set_id === setId);
          const bestScore = Math.max(0, ...results.map((r) => r.score));
          if (bestScore >= 80) completedSetIds.push(setId);
        }

        // Content availability
        const hasLastReviewContent =
          unitLastReviewSheets.length > 0 ||
          unitSimilarProblems.length > 0 ||
          unitReviewContent.length > 0;

        const videoLessons = unitGrammar.filter((l: { content_type: string }) => l.content_type === 'video');

        const stageStatuses = calculateStageStatuses({
          progress: unitProgress,
          content: {
            hasVocab: unitVocab.length > 0,
            hasPassage: unitPassages.length > 0,
            hasGrammar: unitGrammar.length > 0,
            hasProblem: unitProblemSheets.length > 0,
            hasLastReview: hasLastReviewContent || !!examDate,
          },
          vocabQuizSetCount: unitQuizSets.length,
          grammarVideoCount: videoLessons.length,
          examDate,
        });

        return {
          id: u.id,
          unit_number: u.unit_number,
          title: u.title,
          sort_order: u.sort_order,
          vocabulary: unitVocab,
          passages: unitPassages,
          grammarLessons: unitGrammar,
          stageStatuses,
          quizSets: unitQuizSets,
          completedSetIds,
          videoProgress: unitVideoProgress,
          problemSheets: unitProblemSheets,
          lastReviewProblemSheets: unitLastReviewSheets,
          similarProblems: unitSimilarProblems,
          reviewContent: unitReviewContent,
          examDate,
        };
      });
    }
  }

  return (
    <>
      <Topbar user={user} title="내신 대비" />
      <div className="p-4 md:p-6">
        <NaesinHome
          textbooks={textbooks || []}
          selectedTextbook={setting?.textbook ? setting.textbook : null}
          unitDetails={unitDetails}
          examDate={examDate}
          textbookId={setting?.textbook_id || null}
        />
      </div>
    </>
  );
}

function groupBy<T extends Record<string, unknown>>(items: T[], key: string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = item[key] as string;
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}
