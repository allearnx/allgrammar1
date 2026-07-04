import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { VocaDashboard } from '@/components/dashboard/voca-dashboard';
import { SubscriptionBanner } from '@/components/billing/subscription-banner';
import { fetchVocaDashboardData } from '@/lib/dashboard/fetch-voca-data';
import type { AuthUser } from '@/types/auth';
import type { PlanContext } from '@/lib/billing/get-plan-context';
import type { VocaBook } from '@/types/voca';

interface Props {
  user: AuthUser;
  planContext: PlanContext;
  isIndependent: boolean;
}

export async function VocaSection({ user, planContext, isIndependent }: Props) {
  const supabase = await createClient();
  const data = await fetchVocaDashboardData(supabase, user.id);

  // 학습 기록 0 + 교재 미배정 = 첫 진입(결제 직후 등) → 대시보드(빈 통계) 대신
  // 보카 홈으로 보내 학년→교재 가이드부터 시작하게 한다.
  // (선생님이 교재를 배정한 학생은 배정 교재 대시보드 그대로)
  if (data.progressList.length === 0 && !data.hasBookAssignment) {
    redirect('/student/voca');
  }

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
        submissionStatuses={data.submissionStatuses}
      />
    </>
  );
}
