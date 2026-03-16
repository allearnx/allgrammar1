// Phase 3 dead code — 프로덕션 DB에 subscriptions/payment_history 테이블 없음.
// 빌링 구현 시까지 이 페이지는 동작하지 않음.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { SubscriptionBanner } from '@/components/billing/subscription-banner';
import { SubscriptionInfoCard } from '@/components/billing/subscription-info-card';
import { PaymentHistoryCard } from '@/components/billing/payment-history-card';
import { PlanComparison } from '@/components/billing/plan-comparison';
import { requestTossCardAuth, cancelSubscription, calcTrialDaysLeft } from '@/lib/billing/toss-helpers';
import { deriveTier } from '@/lib/billing/feature-gate';
import type { Subscription, PaymentHistory, SubscriptionPlan } from '@/types/billing';
import type { Tier, FreeService } from '@/lib/billing/feature-gate';

interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
}

export default function AdminBillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<Tier>('free');
  const [freeService, setFreeService] = useState<FreeService | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users')
      .select('academy_id')
      .eq('id', user.id)
      .single();

    if (!profile?.academy_id) {
      setLoading(false);
      return;
    }

    const { data: academy } = await supabase
      .from('academies')
      .select('free_service')
      .eq('id', profile.academy_id)
      .single();

    setFreeService((academy?.free_service as FreeService | null) ?? null);

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('academy_id', profile.academy_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sub) {
      const typedSub = sub as unknown as SubscriptionWithPlan;
      setSubscription(typedSub);
      setTier(deriveTier({ status: typedSub.status, tier: typedSub.tier }));

      const { data: hist } = await supabase
        .from('payment_history')
        .select('*')
        .eq('subscription_id', sub.id)
        .order('created_at', { ascending: false });

      setPayments((hist as PaymentHistory[]) || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="p-6">로딩 중...</div>;

  const trialDaysLeft = calcTrialDaysLeft(subscription?.trial_end ?? null);

  return (
    <div className="space-y-0">
      {subscription && (
        <SubscriptionBanner
          status={subscription.status}
          trialDaysLeft={trialDaysLeft}
          billingPageHref="/admin/billing"
          tier={tier}
          freeService={freeService}
        />
      )}

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">결제 관리</h1>

        {!subscription ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              활성 구독이 없습니다
            </CardContent>
          </Card>
        ) : (
          <>
            <SubscriptionInfoCard
              planName={subscription.plan?.name}
              status={subscription.status}
              priceLabel={`${subscription.plan?.price_per_unit.toLocaleString()}원 / 학생`}
              billingKey={subscription.billing_key}
              periodStart={subscription.current_period_start}
              periodEnd={subscription.current_period_end}
              onRegisterCard={() => requestTossCardAuth(subscription.customer_key)}
              onCancel={() => cancelSubscription(subscription.id, fetchData)}
            />
            <PaymentHistoryCard payments={payments} />
          </>
        )}

        <Card>
          <CardContent className="pt-6">
            <PlanComparison showCta={tier === 'free'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
