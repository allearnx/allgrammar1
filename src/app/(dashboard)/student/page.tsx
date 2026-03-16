import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { VocaDashboard } from '@/components/dashboard/voca-dashboard';
import { NaesinNoTextbookScreen } from '@/components/dashboard/naesin-no-textbook-screen';
import { NoServicesScreen } from '@/components/dashboard/no-services-screen';
import { NaesinDashboard } from '@/components/dashboard/naesin-dashboard';
import { CombinedDashboard } from '@/components/dashboard/combined-dashboard';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { SubscriptionBanner } from '@/components/billing/subscription-banner';
import { mergeEnabledStages } from '@/lib/billing/feature-gate';
import { fetchVocaDashboardData } from '@/lib/dashboard/fetch-voca-data';
import { fetchNaesinDashboardData } from '@/lib/dashboard/fetch-naesin-data';
import type { VocaBook } from '@/types/voca';

export default async function StudentDashboard() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Check service assignments
  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('service')
    .eq('student_id', user.id);

  const services = assignments?.map((a) => a.service) || [];
  const vocaOnly = services.length === 1 && services[0] === 'voca';
  const naesinOnly = services.length === 1 && services[0] === 'naesin';
  const hasBoth = services.includes('voca') && services.includes('naesin');

  const planContext = await getPlanContext(user.academy_id, user.id);

  const isIndependent = !user.academy_id;

  // ── Voca-only dashboard ──
  if (vocaOnly) {
    const data = await fetchVocaDashboardData(supabase, user.id);
    return (
      <>
        <Topbar user={user} title="올킬보카" />
        {isIndependent && planContext.tier === 'free' && (
          <SubscriptionBanner
            status="active"
            tier="free"
            freeService={planContext.freeService}
            billingPageHref="/student/billing"
            isIndividual
          />
        )}
        <VocaDashboard
          userName={user.full_name}
          books={(data.books as VocaBook[]) || []}
          days={data.days}
          progressList={data.progressList}
          wordCount={data.wordCount}
          wrongWordCounts={data.wrongWordCounts}
          quizHistory={data.quizHistory}
        />
      </>
    );
  }

  // ── Naesin-only dashboard ──
  if (naesinOnly) {
    const { data: settings } = await supabase
      .from('naesin_student_settings')
      .select('textbook_id, enabled_stages')
      .eq('student_id', user.id)
      .single();

    const effectiveEnabledStages = mergeEnabledStages(
      planContext.tier,
      settings?.enabled_stages as string[] | null,
    );

    const textbookId = settings?.textbook_id;

    if (textbookId) {
      const data = await fetchNaesinDashboardData(supabase, user.id, textbookId);
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
            enabledStages={effectiveEnabledStages}
            quizHistory={data.quizHistory}
          />
        </>
      );
    }

    // naesin 배정되었지만 교과서 미선택
    return (
      <>
        <Topbar user={user} title="내신 대비" />
        <NaesinNoTextbookScreen userName={user.full_name} />
      </>
    );
  }

  // ── Combined (voca + naesin) dashboard ──
  if (hasBoth) {
    const { data: naesinSettings } = await supabase
      .from('naesin_student_settings')
      .select('textbook_id, enabled_stages')
      .eq('student_id', user.id)
      .single();

    const textbookId = naesinSettings?.textbook_id;

    const [vocaData, naesinData] = await Promise.all([
      fetchVocaDashboardData(supabase, user.id),
      textbookId
        ? fetchNaesinDashboardData(supabase, user.id, textbookId)
        : Promise.resolve({
            textbookName: '교과서',
            units: [],
            progressList: [],
            examAssignments: [],
            contentMap: {},
            vocabQuizSetCounts: {},
            grammarVideoCounts: {},
            quizHistory: [],
          }),
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
          enabledStages={mergeEnabledStages(
            planContext.tier,
            naesinSettings?.enabled_stages as string[] | null,
          )}
          wrongWordCounts={vocaData.wrongWordCounts}
          vocaQuizHistory={vocaData.quizHistory}
          naesinQuizHistory={naesinData.quizHistory}
        />
      </>
    );
  }

  // ── No services assigned: premium waiting screen ──
  return (
    <>
      <Topbar user={user} title="대시보드" />
      <NoServicesScreen userName={user.full_name} />
    </>
  );
}
