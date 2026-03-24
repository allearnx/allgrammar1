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

interface BillingPageContentProps {
  mode: 'student' | 'academy';
}

export function BillingPageContent({ mode }: BillingPageContentProps) {
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<Tier>('free');
  const [freeService, setFreeService] = useState<FreeService | null>(null);

  const billingHref = mode === 'student' ? '/student/billing' : '/admin/billing';

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let subscriptionQuery;

    if (mode === 'academy') {
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

      subscriptionQuery = supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('academy_id', profile.academy_id);
    } else {
      subscriptionQuery = supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('student_id', user.id);
    }

    const { data: sub } = await subscriptionQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sub) {
      const typedSub = sub as unknown as SubscriptionWithPlan;
      setSubscription(typedSub);
      if (mode === 'academy') {
        setTier(deriveTier({ status: typedSub.status, tier: typedSub.tier }));
      }

      const { data: hist } = await supabase
        .from('payment_history')
        .select('*')
        .eq('subscription_id', sub.id)
        .order('created_at', { ascending: false });
      setPayments((hist as PaymentHistory[]) || []);
    }

    setLoading(false);
  }, [mode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="p-6">로딩 중...</div>;

  const trialDaysLeft = calcTrialDaysLeft(subscription?.trial_end ?? null);
  const priceLabel = mode === 'academy'
    ? `${subscription?.plan?.price_per_unit.toLocaleString()}원 / 학생`
    : `${subscription?.plan?.price_per_unit.toLocaleString()}원/월`;

  return (
    <div className="space-y-0">
      {subscription && (
        <SubscriptionBanner
          status={subscription.status}
          trialDaysLeft={trialDaysLeft}
          billingPageHref={billingHref}
          {...(mode === 'academy' ? { tier, freeService } : {})}
        />
      )}

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">결제 관리</h1>

        {!subscription ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {mode === 'academy'
                ? '활성 구독이 없습니다'
                : '활성 구독이 없습니다. 요금제를 선택해주세요.'}
            </CardContent>
          </Card>
        ) : (
          <>
            <SubscriptionInfoCard
              planName={subscription.plan?.name}
              status={subscription.status}
              priceLabel={priceLabel}
              billingKey={subscription.billing_key}
              periodStart={subscription.current_period_start}
              periodEnd={subscription.current_period_end}
              onRegisterCard={() => requestTossCardAuth(subscription.customer_key)}
              onCancel={() => cancelSubscription(subscription.id, fetchData)}
            />
            <PaymentHistoryCard payments={payments} />
          </>
        )}

        {mode === 'academy' && (
          <Card>
            <CardContent className="pt-6">
              <PlanComparison showCta={tier === 'free'} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
