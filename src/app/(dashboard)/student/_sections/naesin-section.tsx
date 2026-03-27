import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinDashboard } from '@/components/dashboard/naesin-dashboard';
import { NaesinNoTextbookScreen } from '@/components/dashboard/naesin-no-textbook-screen';
import { mergeEnabledStages } from '@/lib/billing/feature-gate';
import { fetchNaesinSettings, fetchNaesinDashboardData } from '@/lib/dashboard/fetch-naesin-data';
import type { AuthUser } from '@/types/auth';
import type { PlanContext } from '@/lib/billing/get-plan-context';

interface Props {
  user: AuthUser;
  planContext: PlanContext;
}

export async function NaesinSection({ user, planContext }: Props) {
  const supabase = await createClient();
  const settings = await fetchNaesinSettings(supabase, user.id);
  const enabledStages = mergeEnabledStages(planContext.tier, settings.enabled_stages);

  if (!settings.textbook_id) {
    return (
      <>
        <Topbar user={user} title="내신 대비" />
        <NaesinNoTextbookScreen userName={user.full_name} />
      </>
    );
  }

  const data = await fetchNaesinDashboardData(supabase, user.id, settings.textbook_id);

  return (
    <>
      <Topbar user={user} title="내신 대비" />
      <NaesinDashboard
        userName={user.full_name}
        textbookName={data.textbookName}
        units={data.units}
        progressList={data.progressList}
        examAssignments={data.examAssignments}
        contentMap={data.contentMap}
        vocabQuizSetCounts={data.vocabQuizSetCounts}
        grammarVideoCounts={data.grammarVideoCounts}
        enabledStages={enabledStages}
        quizHistory={data.quizHistory}
      />
    </>
  );
}
