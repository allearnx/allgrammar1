import { requireRole } from '@/lib/auth/helpers';
import { requireNaesinAccess } from '@/lib/naesin/require-naesin-access';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound, redirect } from 'next/navigation';
import { NaesinStageView } from './client';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import { mergeEnabledStages, getNaesinUnitLimit } from '@/lib/billing/feature-gate';
import { fetchContentAvailability } from '@/lib/naesin/fetch-content-availability';
import { fetchStageData } from '@/lib/naesin/fetch-stage-data';

const VALID_STAGES = ['vocab', 'passage', 'dialogue', 'textbookVideo', 'grammar', 'problem', 'mockExam', 'lastReview'] as const;
type StageKey = (typeof VALID_STAGES)[number];

interface Props {
  params: Promise<{ unitId: string; stage: string }>;
}

export default async function NaesinStagePage({ params }: Props) {
  const { unitId, stage } = await params;

  if (!VALID_STAGES.includes(stage as StageKey)) notFound();
  const stageKey = stage as StageKey;

  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from('naesin_units')
    .select('*, textbook:naesin_textbooks(id, display_name)')
    .eq('id', unitId)
    .single();

  if (!unit) notFound();

  const textbookId = (unit.textbook as { id: string; display_name: string } | null)?.id ?? null;

  const { progress, contentAvailability, videoLessons, textbookVideoCount, quizSetIds, examDate, problemSheetCount, problemSheetsAttempted } =
    await fetchContentAvailability(supabase, user.id, unitId, textbookId);

  // Fetch enabled_stages from student settings
  const { data: studentSettings } = await supabase
    .from('naesin_student_settings')
    .select('enabled_stages')
    .eq('student_id', user.id)
    .single();

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

  const planContext = await requireNaesinAccess(user); // 서비스 게이트 (무료 택1 포함)
  const enabledStages = mergeEnabledStages(
    planContext.tier,
    studentSettings?.enabled_stages as string[] | null,
    planContext.naesinMemorizeOnly,
  );

  // 무료 체험 단원 제한: sort_order 기준으로 제한 초과 시 리다이렉트
  const unitLimit = getNaesinUnitLimit(planContext.tier, planContext.naesinMemorizeOnly);
  if (unitLimit > 0 && textbookId) {
    const { count } = await supabase
      .from('naesin_units')
      .select('id', { count: 'exact', head: true })
      .eq('textbook_id', textbookId)
      .eq('is_active', true)
      .lt('sort_order', unit.sort_order);
    if ((count ?? 0) >= unitLimit) redirect('/student/naesin');
  }

  const stageStatuses = calculateStageStatuses({
    progress,
    content: contentAvailability,
    vocabQuizSetCount: quizSetIds.length,
    textbookVideoCount,
    grammarVideoCount: videoLessons.length,
    examDate,
    enabledStages,
    naesinRequiredRounds,
    problemSheetCount,
    problemSheetsAttempted,
  });

  const isHidden = stageStatuses[stageKey] === 'hidden';
  const isLocked = stageStatuses[stageKey] === 'locked';
  const rawStageData = (isHidden || isLocked)
    ? {}
    : await fetchStageData(supabase, user.id, unitId, stageKey, quizSetIds, progress);
  const stageData = {
    ...rawStageData,
    naesinRequiredRounds,
  };

  return (
    <>
      <Topbar user={user} title={unit.title} />
      <div className="p-4 md:p-6">
        <NaesinStageView
          unit={{ id: unit.id, unit_number: unit.unit_number, title: unit.title }}
          currentStage={stageKey}
          stageStatuses={stageStatuses}
          stageData={stageData}
          isLocked={isLocked}
          isHidden={isHidden}
          examDate={examDate}
        />
      </div>
    </>
  );
}
