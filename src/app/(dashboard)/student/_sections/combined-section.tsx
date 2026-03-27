import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { CombinedDashboard } from '@/components/dashboard/combined-dashboard';
import { mergeEnabledStages } from '@/lib/billing/feature-gate';
import { fetchVocaDashboardData } from '@/lib/dashboard/fetch-voca-data';
import {
  fetchNaesinSettings,
  fetchNaesinDashboardData,
  EMPTY_NAESIN_DATA,
} from '@/lib/dashboard/fetch-naesin-data';
import type { AuthUser } from '@/types/auth';
import type { PlanContext } from '@/lib/billing/get-plan-context';

interface Props {
  user: AuthUser;
  planContext: PlanContext;
}

export async function CombinedSection({ user, planContext }: Props) {
  const supabase = await createClient();
  const settings = await fetchNaesinSettings(supabase, user.id);

  const [vocaData, naesinData] = await Promise.all([
    fetchVocaDashboardData(supabase, user.id),
    settings.textbook_id
      ? fetchNaesinDashboardData(supabase, user.id, settings.textbook_id)
      : Promise.resolve(EMPTY_NAESIN_DATA),
  ]);

  return (
    <>
      <Topbar user={user} title="학습 대시보드" />
      <CombinedDashboard
        userName={user.full_name}
        vocaDays={vocaData.days}
        vocaProgressList={vocaData.progressList}
        textbookName={naesinData.textbookName}
        naesinUnits={naesinData.units}
        naesinProgressList={naesinData.progressList}
        examAssignments={naesinData.examAssignments}
        contentMap={naesinData.contentMap}
        vocabQuizSetCounts={naesinData.vocabQuizSetCounts}
        grammarVideoCounts={naesinData.grammarVideoCounts}
        enabledStages={mergeEnabledStages(planContext.tier, settings.enabled_stages)}
        wrongWordCounts={vocaData.wrongWordCounts}
        vocaQuizHistory={vocaData.quizHistory}
        naesinQuizHistory={naesinData.quizHistory}
      />
    </>
  );
}
