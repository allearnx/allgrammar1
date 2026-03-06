import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinHome } from './client';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { NaesinStageStatuses, NaesinExamAssignment } from '@/types/database';

interface UnitSummary {
  id: string;
  unit_number: number;
  title: string;
  sort_order: number;
  stageStatuses: NaesinStageStatuses;
  stageProgress: { vocab: number; passage: number; grammar: number; problem: number };
}

export interface ExamGroup {
  round: number;
  label: string;
  examDate: string | null;
  units: UnitSummary[];
}

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

  // Get exam date if textbook selected (legacy)
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

  // If student has a textbook selected, get the units with lightweight data only
  let units: UnitSummary[] = [];
  let examGroups: ExamGroup[] = [];

  if (setting?.textbook_id) {
    const { data: rawUnits } = await supabase
      .from('naesin_units')
      .select('id, unit_number, title, sort_order')
      .eq('textbook_id', setting.textbook_id)
      .eq('is_active', true)
      .order('sort_order');

    if (rawUnits && rawUnits.length > 0) {
      const unitIds = rawUnits.map((u) => u.id);

      // Fetch exam assignments
      const { data: assignments } = await supabase
        .from('naesin_exam_assignments')
        .select('*')
        .eq('student_id', user.id)
        .eq('textbook_id', setting.textbook_id)
        .order('exam_round');

      // Only fetch existence checks + progress (not full content)
      const [
        vocabCountRes,
        passageCountRes,
        grammarCountRes,
        problemCountRes,
        lastReviewSheetCountRes,
        similarProblemCountRes,
        reviewContentCountRes,
        progressRes,
        quizSetsCountRes,
      ] = await Promise.all([
        supabase.from('naesin_vocabulary').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_passages').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_grammar_lessons').select('id, unit_id, content_type').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('unit_id').eq('category', 'problem').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('unit_id').eq('category', 'last_review').in('unit_id', unitIds),
        supabase.from('naesin_similar_problems').select('unit_id').eq('status', 'approved').in('unit_id', unitIds),
        supabase.from('naesin_last_review_content').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_student_progress').select('*').eq('student_id', user.id).in('unit_id', unitIds),
        supabase.from('naesin_vocab_quiz_sets').select('id, unit_id').in('unit_id', unitIds),
      ]);

      // Build per-unit existence sets
      const vocabUnitIds = new Set((vocabCountRes.data || []).map((r) => r.unit_id));
      const passageUnitIds = new Set((passageCountRes.data || []).map((r) => r.unit_id));
      const grammarByUnit = groupBy(grammarCountRes.data || [], 'unit_id');
      const problemUnitIds = new Set((problemCountRes.data || []).map((r) => r.unit_id));
      const lastReviewSheetUnitIds = new Set((lastReviewSheetCountRes.data || []).map((r) => r.unit_id));
      const similarProblemUnitIds = new Set((similarProblemCountRes.data || []).map((r) => r.unit_id));
      const reviewContentUnitIds = new Set((reviewContentCountRes.data || []).map((r) => r.unit_id));
      const progressMap = new Map((progressRes.data || []).map((p) => [p.unit_id, p]));
      const quizSetsByUnit = groupBy(quizSetsCountRes.data || [], 'unit_id');

      type RawUnit = { id: string; unit_number: number; title: string; sort_order: number };
      function buildUnitSummary(u: RawUnit, overrideExamDate?: string | null): UnitSummary {
        const unitProgress = progressMap.get(u.id) || null;
        const unitGrammar = grammarByUnit[u.id] || [];
        const videoLessons = unitGrammar.filter((l: { content_type: string }) => l.content_type === 'video');
        const unitQuizSets = quizSetsByUnit[u.id] || [];
        const effectiveExamDate = overrideExamDate !== undefined ? overrideExamDate : examDate;

        const hasLastReviewContent =
          lastReviewSheetUnitIds.has(u.id) ||
          similarProblemUnitIds.has(u.id) ||
          reviewContentUnitIds.has(u.id);

        const stageStatuses = calculateStageStatuses({
          progress: unitProgress,
          content: {
            hasVocab: vocabUnitIds.has(u.id),
            hasPassage: passageUnitIds.has(u.id),
            hasGrammar: unitGrammar.length > 0,
            hasProblem: problemUnitIds.has(u.id),
            hasLastReview: hasLastReviewContent || !!effectiveExamDate,
          },
          vocabQuizSetCount: unitQuizSets.length,
          grammarVideoCount: videoLessons.length,
          examDate: effectiveExamDate,
        });

        const stageProgress = computeStageProgress(unitProgress, unitQuizSets.length, videoLessons.length);

        return {
          id: u.id,
          unit_number: u.unit_number,
          title: u.title,
          sort_order: u.sort_order,
          stageStatuses,
          stageProgress,
        };
      }

      // Build exam groups from assignments
      const assignmentsList = (assignments || []) as NaesinExamAssignment[];
      const unitMap = new Map(rawUnits.map((u) => [u.id, u]));

      if (assignmentsList.length > 0) {
        examGroups = assignmentsList.map((a) => ({
          round: a.exam_round,
          label: a.exam_label || `${a.exam_round}차 시험`,
          examDate: a.exam_date,
          units: a.unit_ids
            .map((uid) => unitMap.get(uid))
            .filter(Boolean)
            .map((u) => buildUnitSummary(u!, a.exam_date)),
        }));
      }

      // Also build flat units for fallback display (when no assignments)
      units = rawUnits.map((u) => buildUnitSummary(u));
    }
  }

  return (
    <>
      <Topbar user={user} title="내신 대비" />
      <div className="p-4 md:p-6">
        <NaesinHome
          textbooks={textbooks || []}
          selectedTextbook={setting?.textbook ? setting.textbook : null}
          units={units}
          examDate={examDate}
          textbookId={setting?.textbook_id || null}
          examGroups={examGroups}
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

interface ProgressLike {
  vocab_quiz_score: number | null;
  vocab_spelling_score: number | null;
  vocab_completed: boolean;
  passage_fill_blanks_best: number | null;
  passage_translation_best: number | null;
  passage_completed: boolean;
  grammar_videos_completed: number;
  grammar_completed: boolean;
  problem_completed: boolean;
}

function computeStageProgress(
  progress: ProgressLike | null,
  quizSetCount: number,
  videoCount: number
): { vocab: number; passage: number; grammar: number; problem: number } {
  if (!progress) return { vocab: 0, passage: 0, grammar: 0, problem: 0 };

  // Vocab: average of quiz + spelling scores (or 100 if completed)
  let vocab = 0;
  if (progress.vocab_completed) {
    vocab = 100;
  } else {
    const q = progress.vocab_quiz_score ?? 0;
    const s = progress.vocab_spelling_score ?? 0;
    vocab = quizSetCount > 0 ? Math.round((q + s) / 2) : 0;
  }

  // Passage: average of fill_blanks + translation scores
  let passage = 0;
  if (progress.passage_completed) {
    passage = 100;
  } else {
    const fb = progress.passage_fill_blanks_best ?? 0;
    const tr = progress.passage_translation_best ?? 0;
    passage = Math.round((fb + tr) / 2);
  }

  // Grammar: videos completed / total
  let grammar = 0;
  if (progress.grammar_completed) {
    grammar = 100;
  } else if (videoCount > 0) {
    grammar = Math.round((progress.grammar_videos_completed / videoCount) * 100);
  }

  // Problem: 0 or 100
  const problem = progress.problem_completed ? 100 : 0;

  return { vocab, passage, grammar, problem };
}
