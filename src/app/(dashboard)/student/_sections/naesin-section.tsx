import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinDashboard } from '@/components/dashboard/naesin-dashboard';
import { NaesinNoTextbookScreen } from '@/components/dashboard/naesin-no-textbook-screen';
import { SubscriptionBanner } from '@/components/billing/subscription-banner';
import { FreeWelcomeModal } from '@/components/billing/free-welcome-modal';
import { FreeTryOtherCard } from '@/components/billing/free-try-other-card';
import { mergeEnabledStages } from '@/lib/billing/feature-gate';
import { fetchNaesinSettings, fetchNaesinDashboardData } from '@/lib/dashboard/fetch-naesin-data';
import { buildQuickStart } from '@/lib/dashboard/quick-start';
import { QuickStartCards } from '@/components/dashboard/quick-start-cards';
import type { AuthUser } from '@/types/auth';
import type { PlanContext } from '@/lib/billing/get-plan-context';

interface Props {
  user: AuthUser;
  planContext: PlanContext;
  isIndependent?: boolean;
}

export async function NaesinSection({ user, planContext, isIndependent = false }: Props) {
  const supabase = await createClient();
  const settings = await fetchNaesinSettings(supabase, user.id);
  const enabledStages = mergeEnabledStages(planContext.tier, settings.enabled_stages, planContext.naesinMemorizeOnly);

  // 무료: 안내 띠 + (처음이면) 올인내신 환영 팝업 + 올킬보카 체험 추천
  const freeBanner = planContext.tier === 'free' && (
    <>
      <SubscriptionBanner
        status="active"
        tier="free"
        freeService={planContext.freeService}
        billingPageHref="/student/billing"
        isIndividual={isIndependent}
        forStudent
      />
      {!planContext.naesinMemorizeOnly && (
        <FreeWelcomeModal service="naesin" userId={user.id} userName={user.full_name} />
      )}
      <div className="px-4 md:px-6 pt-4"><FreeTryOtherCard current="naesin" userId={user.id} /></div>
    </>
  );

  if (!settings.textbook_id) {
    return (
      <>
        <Topbar user={user} title="내신 대비" />
        {freeBanner}
        <NaesinNoTextbookScreen userName={user.full_name} />
      </>
    );
  }

  const data = await fetchNaesinDashboardData(supabase, user.id, settings.textbook_id);
  const quickStart = await buildQuickStart(supabase, user.id, { naesin: true, voca: false });

  return (
    <>
      <Topbar user={user} title="홈" />
      {freeBanner}
      <div className="px-4 md:px-6 pt-4 md:pt-6"><QuickStartCards quickStart={quickStart} /></div>
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
        isPaid={planContext.tier !== 'free' || planContext.naesinMemorizeOnly}
      />
    </>
  );
}
