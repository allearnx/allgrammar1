// Phase 3 dead code — 프로덕션 DB에 subscriptions/payment_history 테이블 없음.
// 빌링 구현 시까지 이 페이지는 동작하지 않음.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Receipt } from 'lucide-react';
import { SubscriptionBanner } from '@/components/billing/subscription-banner';
import { PlanComparison } from '@/components/billing/plan-comparison';
import type { Subscription, PaymentHistory, SubscriptionPlan } from '@/types/billing';
import { deriveTier } from '@/lib/billing/feature-gate';
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

    // 현재 학원 구독 조회
    const { data: profile } = await supabase
      .from('users')
      .select('academy_id')
      .eq('id', user.id)
      .single();

    if (!profile?.academy_id) {
      setLoading(false);
      return;
    }

    // Fetch academy free_service
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

      // 결제 내역
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

  function handleRegisterCard() {
    if (!subscription) return;

    // @ts-expect-error -- tosspayments sdk loaded via script
    const tossPayments = window.TossPayments?.(
      process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY,
    );
    if (!tossPayments) {
      toast.error('결제 모듈을 불러올 수 없습니다');
      return;
    }

    const payment = tossPayments.payment({ customerKey: subscription.customer_key });
    payment.requestBillingAuth('카드', {
      successUrl: `${window.location.origin}/billing/callback?customerKey=${subscription.customer_key}`,
      failUrl: `${window.location.origin}/billing/callback`,
    });
  }

  async function handleCancel() {
    if (!subscription) return;
    if (!confirm('정말 구독을 해지하시겠습니까? 현재 기간이 끝나면 서비스가 중단됩니다.')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('id', subscription.id);

    if (error) {
      toast.error('해지 실패');
    } else {
      toast.success('구독이 해지되었습니다');
      fetchData();
    }
  }

  if (loading) return <div className="p-6">로딩 중...</div>;

  const trialDaysLeft = subscription?.trial_end
    // eslint-disable-next-line react-hooks/purity
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / 86400000))
    : 0;

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
            {/* 구독 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  구독 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">요금제</span>
                  <span className="font-medium">{subscription.plan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태</span>
                  <Badge>{subscription.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">단가</span>
                  <span>{subscription.plan?.price_per_unit.toLocaleString()}원 / 학생</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">결제 수단</span>
                  <span>{subscription.billing_key ? '카드 등록됨' : '미등록'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">현재 기간</span>
                  <span className="text-sm">
                    {new Date(subscription.current_period_start).toLocaleDateString('ko')} ~{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('ko')}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  {!subscription.billing_key && (
                    <Button onClick={handleRegisterCard}>
                      <CreditCard className="h-4 w-4 mr-1" />
                      카드 등록
                    </Button>
                  )}
                  {subscription.billing_key && (
                    <Button variant="outline" onClick={handleRegisterCard}>
                      카드 변경
                    </Button>
                  )}
                  {subscription.status !== 'canceled' && subscription.status !== 'expired' && (
                    <Button variant="destructive" onClick={handleCancel}>
                      구독 해지
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 결제 내역 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  결제 내역
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">결제 내역이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <span className="text-sm">
                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString('ko') : new Date(p.created_at).toLocaleDateString('ko')}
                          </span>
                          <Badge variant={p.status === 'success' ? 'default' : 'destructive'} className="ml-2">
                            {p.status === 'success' ? '성공' : p.status === 'failed' ? '실패' : '환불'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{p.amount.toLocaleString()}원</span>
                          {p.receipt_url && (
                            <a
                              href={p.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary ml-2 hover:underline"
                            >
                              영수증
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* 플랜 비교 */}
        <Card>
          <CardHeader>
            <CardTitle>플랜 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanComparison showCta={tier === 'free'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
