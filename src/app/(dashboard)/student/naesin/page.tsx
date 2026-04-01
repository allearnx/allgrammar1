import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinHome } from './client';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { mergeEnabledStages } from '@/lib/billing/feature-gate';
import { groupBy, buildUnitSummary } from '@/lib/naesin/build-unit-summary';
import type { UnitSummary, ExamGroup } from '@/lib/naesin/build-unit-summary';
import type { NaesinExamAssignment } from '@/types/database';

export default async function NaesinPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Get student's textbook setting (including enabled_stages)
  const { data: setting } = await supabase
    .from('naesin_student_settings')
    .select('*, textbook:naesin_textbooks(*)')
    .eq('student_id', user.id)
    .single();

  // Merge teacher-configured stages with plan-based restrictions
  const planContext = await getPlanContext(user.academy_id, user.id);
  const enabledStages = mergeEnabledStages(
    planContext.tier,
    setting?.enabled_stages as string[] | null,
  );

  // Fetch academy-level naesin_required_rounds
  let naesinRequiredRounds = 1;
  if (user.academy_id) {
    const { data: academy } = await supabase
      .from('academies')
      .select('naesin_required_rounds')
      .eq('id', user.academy_id)
      .single();
    naesinRequiredRounds = academy?.naesin_required_rounds ?? 1;
  }

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
        dialogueCountRes,
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
        supabase.from('naesin_dialogues').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_grammar_lessons').select('id, unit_id, content_type').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('unit_id').eq('category', 'problem').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('unit_id').eq('category', 'last_review').in('unit_id', unitIds),
        supabase.from('naesin_similar_problems').select('unit_id').eq('status', 'approved').in('unit_id', unitIds),
        supabase.from('naesin_last_review_content').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_student_progress').select('*').eq('student_id', user.id).in('unit_id', unitIds),
        supabase.from('naesin_vocab_quiz_sets').select('id, unit_id').in('unit_id', unitIds),
      ]);

      // Build per-unit context
      const ctx = {
        vocabUnitIds: new Set((vocabCountRes.data || []).map((r) => r.unit_id)),
        passageUnitIds: new Set((passageCountRes.data || []).map((r) => r.unit_id)),
        dialogueUnitIds: new Set((dialogueCountRes.data || []).map((r) => r.unit_id)),
        grammarByUnit: groupBy(grammarCountRes.data || [], 'unit_id'),
        problemUnitIds: new Set((problemCountRes.data || []).map((r) => r.unit_id)),
        lastReviewSheetUnitIds: new Set((lastReviewSheetCountRes.data || []).map((r) => r.unit_id)),
        similarProblemUnitIds: new Set((similarProblemCountRes.data || []).map((r) => r.unit_id)),
        reviewContentUnitIds: new Set((reviewContentCountRes.data || []).map((r) => r.unit_id)),
        progressMap: new Map((progressRes.data || []).map((p) => [p.unit_id, p])),
        quizSetsByUnit: groupBy(quizSetsCountRes.data || [], 'unit_id'),
        examDate,
        enabledStages,
        naesinRequiredRounds,
      };

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
            .map((u) => buildUnitSummary(u!, ctx, a.exam_date)),
        }));
      }

      // Also build flat units for fallback display (when no assignments)
      units = rawUnits.map((u) => buildUnitSummary(u, ctx));
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
          examGroups={examGroups}
        />
      </div>
    </>
  );
}

