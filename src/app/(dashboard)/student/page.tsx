import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { BookMarked, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { VocaDashboard } from '@/components/dashboard/voca-dashboard';
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
        <div className="p-4 md:p-6 space-y-6">
          <div
            className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
            style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' }}
          >
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <h2 className="relative text-xl md:text-2xl font-bold">
              환영합니다, {user.full_name}님!
            </h2>
            <p className="relative mt-1 text-white/80">올인내신이 배정되었어요</p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(120deg, #ECFEFF, #CFFAFE)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-bold">시작하기</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-cyan-500 text-white rounded-full w-7 h-7 text-sm font-bold shrink-0">1</span>
                <BookMarked className="h-5 w-5 text-cyan-400 shrink-0" />
                <span className="text-sm text-gray-700">교과서를 선택하면 학습을 시작할 수 있어요</span>
                <Link href="/student/naesin" className="ml-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-4 py-1.5 text-xs font-medium shrink-0 transition-colors">교과서 선택</Link>
              </div>
            </div>
          </div>
        </div>
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
