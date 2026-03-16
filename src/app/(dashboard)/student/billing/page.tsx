'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { SubscriptionBanner } from '@/components/billing/subscription-banner';
import { SubscriptionInfoCard } from '@/components/billing/subscription-info-card';
import { PaymentHistoryCard } from '@/components/billing/payment-history-card';
import { requestTossCardAuth, cancelSubscription, calcTrialDaysLeft } from '@/lib/billing/toss-helpers';
import type { Subscription, PaymentHistory, SubscriptionPlan } from '@/types/billing';

interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
}

export default function StudentBillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sub) {
      setSubscription(sub as unknown as SubscriptionWithPlan);

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
          billingPageHref="/student/billing"
        />
      )}

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">결제 관리</h1>

        {!subscription ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              활성 구독이 없습니다. 요금제를 선택해주세요.
            </CardContent>
          </Card>
        ) : (
          <>
            <SubscriptionInfoCard
              planName={subscription.plan?.name}
              status={subscription.status}
              priceLabel={`${subscription.plan?.price_per_unit.toLocaleString()}원/월`}
              billingKey={subscription.billing_key}
              periodStart={subscription.current_period_start}
              periodEnd={subscription.current_period_end}
              onRegisterCard={() => requestTossCardAuth(subscription.customer_key)}
              onCancel={() => cancelSubscription(subscription.id, fetchData)}
            />
            <PaymentHistoryCard payments={payments} />
          </>
        )}
      </div>
    </div>
  );
}
