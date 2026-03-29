import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound } from 'next/navigation';
import { NaesinStageView } from './client';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { mergeEnabledStages } from '@/lib/billing/feature-gate';
import { fetchContentAvailability } from '@/lib/naesin/fetch-content-availability';
import { fetchStageData } from '@/lib/naesin/fetch-stage-data';

const VALID_STAGES = ['vocab', 'passage', 'dialogue', 'grammar', 'problem', 'lastReview'] as const;
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

  const { progress, contentAvailability, videoLessons, quizSetIds, examDate } =
    await fetchContentAvailability(supabase, user.id, unitId, textbookId);

  // Fetch enabled_stages from student settings
  const { data: studentSettings } = await supabase
    .from('naesin_student_settings')
    .select('enabled_stages')
    .eq('student_id', user.id)
    .single();

  const planContext = await getPlanContext(user.academy_id, user.id);
  const enabledStages = mergeEnabledStages(
    planContext.tier,
    studentSettings?.enabled_stages as string[] | null,
  );

  const stageStatuses = calculateStageStatuses({
    progress,
    content: contentAvailability,
    vocabQuizSetCount: quizSetIds.length,
    grammarVideoCount: videoLessons.length,
    examDate,
    enabledStages,
  });

  const isHidden = stageStatuses[stageKey] === 'hidden';
  const isLocked = stageStatuses[stageKey] === 'locked';
  const stageData = (isHidden || isLocked)
    ? {}
    : await fetchStageData(supabase, user.id, unitId, stageKey, quizSetIds, progress);

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
