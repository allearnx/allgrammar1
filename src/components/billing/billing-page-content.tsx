'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Check, CheckCircle, Crown, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionBanner } from '@/components/billing/subscription-banner';
import { SubscriptionInfoCard } from '@/components/billing/subscription-info-card';
import { PaymentHistoryCard } from '@/components/billing/payment-history-card';
import { PlanComparison } from '@/components/billing/plan-comparison';
import { requestTossCardAuth, cancelSubscription, calcTrialDaysLeft } from '@/lib/billing/toss-helpers';
import { deriveTier } from '@/lib/billing/feature-gate';
import { SUBSCRIPTION_PLAN_COLUMNS, ORDER_COLUMNS, PAYMENT_HISTORY_COLUMNS, type Subscription, type PaymentHistory, type SubscriptionPlan, type Order } from '@/types/billing';
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
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
      setCurrentPlanId(sub.plan_id);
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

        {/* 요금제 카드 */}
        {mode === 'academy' && plans.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-[17px] font-bold text-gray-900">요금제</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {plans.map((plan) => {
                const isCurrent =
                  (plan.price_per_unit === 0 && tier === 'free') ||
                  (plan.id === currentPlanId && tier !== 'free');
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrent={isCurrent}
                    isFree={tier === 'free'}
                    popular={plan.name === 'Pro 50'}
                  />
                );
              })}
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

/* ─────── PlanCard (Toss-style) ─────── */

const FEATURES_BY_PLAN: Record<string, string[]> = {
  '무료': ['학생 5명', '보카·내신 둘 다 체험 (보카 3 Day · 내신 1단원)', '기본 통계'],
  'Pro 10': ['학생 10명', '올인내신 + 올킬보카', '차트 + 랭킹', '학생 리포트'],
  'Pro 50': ['학생 50명', '올인내신 + 올킬보카', '차트 + 랭킹', '대량 관리', '학생 리포트'],
  'Pro 100': ['학생 100명', '올인내신 + 올킬보카', '차트 + 랭킹', '대량 관리', '학생 리포트'],
  'Pro 180': ['학생 180명', '올인내신 + 올킬보카', '차트 + 랭킹', '대량 관리', '학생 리포트'],
};

function PlanCard({
  plan,
  isCurrent,
  isFree,
  popular,
}: {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  isFree: boolean;
  popular?: boolean;
}) {
  const isFreePlan = plan.price_per_unit === 0;
  const features = FEATURES_BY_PLAN[plan.name] || [];

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-5 transition-all ${
        popular
          ? 'bg-[#3182F6] text-white shadow-lg shadow-blue-200/50'
          : 'bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
      } ${isCurrent ? 'ring-2 ring-[#3182F6] ring-offset-2' : ''}`}
    >
      {popular && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 text-[11px] font-bold text-[#3182F6] shadow-sm">
          인기
        </div>
      )}

      {/* 플랜명 */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${popular ? 'bg-white/20' : 'bg-gray-50'}`}>
          <Users className={`h-3.5 w-3.5 ${popular ? 'text-white' : 'text-gray-400'}`} />
        </div>
        <h3 className={`text-[13px] font-bold ${popular ? 'text-white' : 'text-gray-900'}`}>
          {plan.name}
        </h3>
      </div>

      {/* 가격 */}
      <div className="mb-4">
        {isFreePlan ? (
          <span className={`text-2xl font-bold ${popular ? 'text-white' : 'text-gray-900'}`}>무료</span>
        ) : (
          <>
            <span className={`text-2xl font-bold tabular-nums ${popular ? 'text-white' : 'text-gray-900'}`}>
              {plan.price_per_unit.toLocaleString('ko-KR')}
            </span>
            <span className={`text-xs ml-0.5 ${popular ? 'text-white/60' : 'text-gray-400'}`}>원/월</span>
          </>
        )}
      </div>

      {/* 기능 */}
      <ul className="mb-5 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-[12px]">
            <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${popular ? 'text-white/70' : 'text-[#3182F6]'}`} />
            <span className={popular ? 'text-white/90' : 'text-gray-600'}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div className={`rounded-xl py-2.5 text-center text-[13px] font-semibold ${
          popular ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400'
        }`}>
          현재 플랜
        </div>
      ) : isFree && !isFreePlan ? (
        <Link
          href={`/admin/upgrade?planId=${plan.id}`}
          className={`block rounded-xl py-2.5 text-center text-[13px] font-semibold transition-all ${
            popular
              ? 'bg-white text-[#3182F6] hover:bg-white/90'
              : 'bg-[#3182F6] text-white hover:bg-[#2272EB]'
          }`}
        >
          업그레이드
        </Link>
      ) : (
        <div className={`rounded-xl py-2.5 text-center text-[13px] font-semibold ${
          popular ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400'
        }`}>
          플랜 변경 문의
        </div>
      )}
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko', { year: 'numeric', month: 'short', day: 'numeric' });
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
                      {formatDate(o.paid_at || o.created_at)}
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
