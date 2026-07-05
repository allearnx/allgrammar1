import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinHome } from './client';
import { requireNaesinAccess } from '@/lib/naesin/require-naesin-access';
import { mergeEnabledStages, getNaesinUnitLimit } from '@/lib/billing/feature-gate';
import { groupBy, buildUnitSummary } from '@/lib/naesin/build-unit-summary';
import type { UnitSummary, ExamGroup } from '@/lib/naesin/build-unit-summary';
import type { NaesinExamAssignment, NaesinStudentProgress } from '@/types/database';
import { PROGRESS_SUMMARY_COLUMNS } from '@/types/naesin';

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
  const planContext = await requireNaesinAccess(user); // 서비스 게이트 (무료는 체험 범위로 통과)
  const enabledStages = mergeEnabledStages(
    planContext.tier,
    setting?.enabled_stages as string[] | null,
    planContext.naesinMemorizeOnly,
  );
  const freeUnitLimit = getNaesinUnitLimit(planContext.tier, planContext.naesinMemorizeOnly);

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
    // cover_image_url 컬럼 없음 — 넣으면 쿼리 에러로 학생 교과서 목록이 빈 채로 나옴
    .select('id, display_name, publisher, grade, sort_order, is_active, created_at')
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

  // Fetch textbook-level exam sheets (시험 대비)
  let textbookExams: { id: string; title: string; bestScore: number | null }[] = [];

  if (setting?.textbook_id) {
    const [sheetsRes, attemptsRes] = await Promise.all([
      supabase
        .from('naesin_problem_sheets')
        .select('id, title, sort_order')
        .eq('textbook_id', setting.textbook_id)
        .eq('category', 'mock_exam')
        .order('sort_order'),
      supabase
        .from('naesin_problem_attempts')
        .select('sheet_id, score')
        .eq('student_id', user.id),
    ]);

    const examSheets = sheetsRes.data || [];
    const allAttempts = attemptsRes.data || [];
    const bestBySheet = new Map<string, number>();
    for (const a of allAttempts) {
      const prev = bestBySheet.get(a.sheet_id);
      if (prev == null || a.score > prev) bestBySheet.set(a.sheet_id, a.score);
    }

    textbookExams = examSheets.map((s) => ({
      id: s.id,
      title: s.title,
      bestScore: bestBySheet.get(s.id) ?? null,
    }));
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
        textbookVideoCountRes,
        grammarCountRes,
        problemCountRes,
        mockExamCountRes,
        lastReviewSheetCountRes,
        similarProblemCountRes,
        reviewContentCountRes,
        progressRes,
        quizSetsCountRes,
        attemptedSheetsRes,
      ] = await Promise.all([
        supabase.from('naesin_vocabulary').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_passages').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_dialogues').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_textbook_videos').select('id, unit_id').in('unit_id', unitIds),
        supabase.from('naesin_grammar_lessons').select('id, unit_id, content_type').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('id, unit_id').eq('category', 'problem').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('unit_id').eq('category', 'mock_exam').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('unit_id').eq('category', 'last_review').in('unit_id', unitIds),
        supabase.from('naesin_similar_problems').select('unit_id').eq('status', 'approved').in('unit_id', unitIds),
        supabase.from('naesin_last_review_content').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_student_progress').select(PROGRESS_SUMMARY_COLUMNS).eq('student_id', user.id).in('unit_id', unitIds),
        supabase.from('naesin_vocab_quiz_sets').select('id, unit_id').in('unit_id', unitIds),
        supabase.from('naesin_problem_attempts').select('sheet_id').eq('student_id', user.id),
      ]);

      // Build problem sheet IDs grouped by unit, and attempted sheet IDs set
      const problemSheetRows = problemCountRes.data || [];
      const problemSheetIdsByUnit: Record<string, string[]> = {};
      for (const row of problemSheetRows) {
        const uid = row.unit_id;
        if (!problemSheetIdsByUnit[uid]) problemSheetIdsByUnit[uid] = [];
        problemSheetIdsByUnit[uid].push(row.id);
      }
      const attemptedSheetIds = new Set((attemptedSheetsRes.data || []).map((r) => r.sheet_id));

      // Build per-unit context
      const ctx = {
        vocabUnitIds: new Set((vocabCountRes.data || []).map((r) => r.unit_id)),
        passageUnitIds: new Set((passageCountRes.data || []).map((r) => r.unit_id)),
        dialogueUnitIds: new Set((dialogueCountRes.data || []).map((r) => r.unit_id)),
        textbookVideoByUnit: groupBy(textbookVideoCountRes.data || [], 'unit_id'),
        grammarByUnit: groupBy(grammarCountRes.data || [], 'unit_id'),
        problemUnitIds: new Set((problemCountRes.data || []).map((r) => r.unit_id)),
        mockExamUnitIds: new Set((mockExamCountRes.data || []).map((r) => r.unit_id)),
        lastReviewSheetUnitIds: new Set((lastReviewSheetCountRes.data || []).map((r) => r.unit_id)),
        similarProblemUnitIds: new Set((similarProblemCountRes.data || []).map((r) => r.unit_id)),
        reviewContentUnitIds: new Set((reviewContentCountRes.data || []).map((r) => r.unit_id)),
        progressMap: new Map(((progressRes.data as unknown as NaesinStudentProgress[]) || []).map((p) => [p.unit_id, p])),
        quizSetsByUnit: groupBy(quizSetsCountRes.data || [], 'unit_id'),
        problemSheetIdsByUnit,
        attemptedSheetIds,
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
          textbookId={setting?.textbook_id || null}
          units={units}
          examDate={examDate}
          examGroups={examGroups}
          isPaid={planContext.tier !== 'free' || planContext.naesinMemorizeOnly}
          textbookExams={textbookExams}
          freeUnitLimit={freeUnitLimit}
        />
      </div>
    </>
  );
}

