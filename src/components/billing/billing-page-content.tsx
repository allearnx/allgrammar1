'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionBanner } from '@/components/billing/subscription-banner';
import { SubscriptionInfoCard } from '@/components/billing/subscription-info-card';
import { PaymentHistoryCard } from '@/components/billing/payment-history-card';
import { PlanComparison } from '@/components/billing/plan-comparison';
import { SeatPicker } from '@/components/billing/seat-picker';
import { requestTossCardAuth, cancelSubscription, calcTrialDaysLeft } from '@/lib/billing/toss-helpers';
import { deriveTier } from '@/lib/billing/feature-gate';
import { SUBSCRIPTION_PLAN_COLUMNS, ORDER_COLUMNS, PAYMENT_HISTORY_COLUMNS, type Subscription, type PaymentHistory, type SubscriptionPlan, type Order } from '@/types/billing';
import type { Tier, FreeService } from '@/lib/billing/feature-gate';
import { formatDateKo } from '@/lib/format';

interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
}

interface BillingPageContentProps {
  mode: 'student' | 'academy';
}

export function BillingPageContent({ mode }: BillingPageContentProps) {
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<{ service: string }[]>([]);
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
      const typedSub = sub as SubscriptionWithPlan;
      setSubscription(typedSub);
      if (mode === 'academy') {
        setTier(deriveTier({ status: typedSub.status, tier: typedSub.tier }));
      }

      const { data: hist } = await supabase
        .from('payment_history')
        .select(PAYMENT_HISTORY_COLUMNS)
        .eq('subscription_id', sub.id)
        .order('created_at', { ascending: false });
      setPayments((hist as PaymentHistory[]) || []);
    }

    // 개인 학생: subscription 없어도 orders + service_assignments 조회
    if (mode === 'student') {
      const { data: orderRows } = await supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((orderRows as Order[]) || []);

      const { data: svcRows } = await supabase
        .from('service_assignments')
        .select('service')
        .eq('student_id', user.id);
      setServices(svcRows || []);
    }

    if (mode === 'academy') {
      const { data: planRows } = await supabase
        .from('subscription_plans')
        .select(SUBSCRIPTION_PLAN_COLUMNS)
        .eq('target', 'academy')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setPlans((planRows as SubscriptionPlan[]) || []);
    }

    setLoading(false);
  }, [mode]);

  useEffect(() => { fetchData(); }, [fetchData]); // eslint-disable-line react-hooks/set-state-in-effect -- data fetching

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#3182F6]" />
      </div>
    );
  }

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

      <div className="p-5 md:p-8 space-y-8 max-w-5xl mx-auto">
        <h1 className="text-[22px] font-bold text-gray-900">결제 관리</h1>

        {!subscription ? (
          mode === 'student' && (services.length > 0 || orders.length > 0) ? (
            <div className="space-y-5">
              <StudentServiceCard services={services} />
              <StudentOrderHistory orders={orders} />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 mb-4">
                <Crown className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-[15px] text-gray-500">
                {mode === 'academy'
                  ? '활성 구독이 없습니다'
                  : '활성 구독이 없습니다. 요금제를 선택해주세요.'}
              </p>
            </div>
          )
        ) : (
          <div className="space-y-5">
            <SubscriptionInfoCard
              planName={subscription.plan?.name}
              status={subscription.status}
              priceLabel={priceLabel}
              hasCard={!!subscription.billing_key}
              periodStart={subscription.current_period_start}
              periodEnd={subscription.current_period_end}
              onRegisterCard={() => requestTossCardAuth(subscription.customer_key)}
              onCancel={() => cancelSubscription(subscription.id, fetchData)}
            />
            <PaymentHistoryCard payments={payments} />
            {mode === 'student' && orders.length > 0 && (
              <StudentOrderHistory orders={orders} />
            )}
          </div>
        )}

        {/* 요금제 — 학생 수 선택 → 결제 (클래스카드식, 35개 카드 나열 대신 선택 위젯) */}
        {mode === 'academy' && plans.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-[17px] font-bold text-gray-900">요금제</h2>
            <div className="max-w-md">
              <SeatPicker
                plans={plans.filter((p) => p.price_per_unit > 0)}
                cta={tier === 'free' ? 'upgrade' : 'contact'}
              />
            </div>
          </section>
        )}

        {/* 기능 비교 */}
        {mode === 'academy' && (
          <section className="space-y-5">
            <h2 className="text-[17px] font-bold text-gray-900">기능 비교</h2>
            <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
              <PlanComparison showCta={false} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ─────── Student Service / Order Cards ─────── */

const SERVICE_LABELS: Record<string, string> = {
  naesin: '올인내신',
  voca: '올킬보카',
};

function StudentServiceCard({ services }: { services: { service: string }[] }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-[15px] font-semibold text-gray-400">이용 중인 서비스</h3>
      </div>
      <div className="px-6 pb-6 space-y-2">
        {services.map((s) => (
          <div key={s.service} className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-[14px] font-semibold text-emerald-700">
              {SERVICE_LABELS[s.service] || s.service}
            </span>
            <span className="ml-auto text-[12px] text-emerald-600 font-medium">이용 중</span>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-gray-400 py-2">활성화된 서비스가 없습니다</p>
        )}
      </div>
    </div>
  );
}

const ORDER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: '완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  failed: { label: '실패', color: 'text-red-700', bg: 'bg-red-50' },
  refunded: { label: '환불', color: 'text-amber-700', bg: 'bg-amber-50' },
  canceled: { label: '취소', color: 'text-gray-500', bg: 'bg-gray-100' },
  pending: { label: '대기', color: 'text-gray-500', bg: 'bg-gray-100' },
};

function StudentOrderHistory({ orders }: { orders: Order[] }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-[15px] font-semibold text-gray-400 flex items-center gap-2">
          결제 내역
        </h3>
      </div>
      {orders.length === 0 ? (
        <div className="px-6 pb-8 text-center">
          <p className="text-sm text-gray-400 py-4">결제 내역이 없습니다</p>
        </div>
      ) : (
        <div>
          {orders.map((o, idx) => {
            const info = ORDER_STATUS_MAP[o.status] || ORDER_STATUS_MAP.pending;
            return (
              <div
                key={o.id}
                className={`flex items-center justify-between px-6 py-4 ${
                  idx < orders.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-gray-900">
                    {o.order_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-400">
                      {formatDateKo(o.paid_at || o.created_at)}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${info.color} ${info.bg}`}>
                      {info.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-bold text-gray-900 tabular-nums">
                    {o.amount.toLocaleString()}원
                  </span>
                  {o.receipt_url && (
                    <a
                      href={o.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-gray-400 hover:text-[#3182F6] transition-colors"
                    >
                      영수증
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
