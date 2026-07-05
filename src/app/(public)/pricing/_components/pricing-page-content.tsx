'use client';

import Link from 'next/link';
import { Check, Crown, Sparkles } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/billing';
import { PlanComparison } from '@/components/billing/plan-comparison';

interface PricingPageContentProps {
  plans: SubscriptionPlan[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentTier: 'free' | 'paid' | null;
  currentPlanId: string | null;
}

const FEATURES_BY_PLAN: Record<string, string[]> = {
  '무료': ['학생 5명', '보카·내신 둘 다 체험 (보카 3 Day · 내신 1단원)', '기본 통계'],
  'Pro 10': ['학생 10명', '올인내신 + 올킬보카', '차트 + 랭킹', '학생 리포트'],
  'Pro 50': ['학생 50명', '올인내신 + 올킬보카', '차트 + 랭킹', '대량 관리', '학생 리포트'],
  'Pro 100': ['학생 100명', '올인내신 + 올킬보카', '차트 + 랭킹', '대량 관리', '학생 리포트'],
  'Pro 180': ['학생 180명', '올인내신 + 올킬보카', '차트 + 랭킹', '대량 관리', '학생 리포트'],
};

export function PricingPageContent({
  plans,
  isLoggedIn,
  isAdmin,
  currentTier,
  currentPlanId,
}: PricingPageContentProps) {
  const freePlan = plans.find((p) => p.price_per_unit === 0);
  const proPlansList = plans.filter((p) => p.price_per_unit > 0);

  function getCta(plan: SubscriptionPlan) {
    const isCurrent =
      (plan.price_per_unit === 0 && currentTier === 'free') ||
      (plan.id === currentPlanId && currentTier === 'paid');

    if (isCurrent) {
      return { label: '현재 플랜', href: '#', disabled: true };
    }

    if (!isLoggedIn) {
      return {
        label: plan.price_per_unit === 0 ? '무료로 시작하기' : '시작하기',
        href: '/signup?role=admin',
        disabled: false,
      };
    }

    if (isAdmin && currentTier === 'free' && plan.price_per_unit > 0) {
      return { label: '업그레이드', href: `/admin/upgrade?planId=${plan.id}`, disabled: false };
    }

    if (isAdmin && currentTier === 'paid' && plan.price_per_unit > 0) {
      return { label: '플랜 변경 문의', href: '#', disabled: true };
    }

    return {
      label: plan.price_per_unit === 0 ? '무료로 시작하기' : '시작하기',
      href: '/signup?role=admin',
      disabled: false,
    };
  }

  return (
    <div className="pt-28 pb-20">
      {/* Hero */}
      <div className="mx-auto max-w-4xl px-4 text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 mb-6">
          <Crown className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-700">학원 전용 요금제</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          학원 맞춤 요금제
        </h1>
        <p className="text-lg text-gray-500">
          무료로 시작하고, 필요할 때 업그레이드하세요
        </p>
      </div>

      {/* Price Cards */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-3">
          {freePlan && (
            <PlanCard
              plan={freePlan}
              features={FEATURES_BY_PLAN[freePlan.name] || []}
              cta={getCta(freePlan)}
              variant="outline"
            />
          )}
          {proPlansList.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              features={FEATURES_BY_PLAN[plan.name] || []}
              cta={getCta(plan)}
              variant="violet"
              popular={plan.name === 'Pro 50'}
            />
          ))}
        </div>
      </div>

      {/* C사 비교 — 같은 가격, 단어에서 끝나지 않게 */}
      <div className="mx-auto max-w-3xl px-4 mt-20">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          많이 비교하시는 C사와 정리해 드릴게요
        </h2>
        <p className="text-center text-gray-500 mb-8">
          같은 가격이면, 단어에서 끝나지 않아야 하니까요.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-violet-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-violet-100 bg-violet-50/50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700" scope="col"></th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500" scope="col">C사 (단어 학습)</th>
                <th className="px-4 py-3 text-center font-semibold text-violet-700" scope="col">올라영</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-medium text-gray-700">월 28,000원</td>
                <td className="px-4 py-3 text-center text-gray-500">학생 10명</td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900">학생 10명</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-700">월 84,000원</td>
                <td className="px-4 py-3 text-center text-gray-500">학생 50명</td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900">학생 50명</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-700">학생 100명 기준</td>
                <td className="px-4 py-3 text-center text-gray-500">월 154,000원</td>
                <td className="px-4 py-3 text-center font-bold text-violet-700">월 140,000원</td>
              </tr>
              {[
                ['단어 암기 학습 (카드·퀴즈·스펠링·매칭)', true, true],
                ['AI 서술형 · 영작 채점', false, true],
                ['내신 교과서 · 대화문 암기', false, true],
                ['내신 문제풀이 · 예상문제', false, true],
                ['오답 자동 관리', false, true],
                ['학부모 리포트', false, true],
                ['실시간 학습 모니터', false, true],
              ].map(([label, cSa, us]) => (
                <tr key={label as string}>
                  <td className="px-4 py-3 text-gray-700">{label}</td>
                  <td className="px-4 py-3 text-center">{cSa ? <span className="text-gray-400">✓</span> : <span className="text-gray-300">–</span>}</td>
                  <td className="px-4 py-3 text-center">{us ? <span className="font-bold text-violet-600">✓</span> : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="mx-auto max-w-3xl px-4 mt-20">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          기능 비교
        </h2>
        <PlanComparison showCta={false} />
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto max-w-2xl px-4 mt-16 text-center">
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-8">
          <Sparkles className="h-8 w-8 text-violet-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            더 많은 학생이 필요하신가요?
          </h3>
          <p className="text-gray-500 mb-6">
            180명 이상 대규모 학원은 별도 문의해 주세요.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
          >
            문의하기
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── PlanCard ──

interface PlanCardProps {
  plan: SubscriptionPlan;
  features: string[];
  cta: { label: string; href: string; disabled: boolean };
  variant: 'outline' | 'violet';
  popular?: boolean;
}

function PlanCard({ plan, features, cta, variant, popular }: PlanCardProps) {
  const isOutline = variant === 'outline';

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 transition-all ${
        isOutline
          ? 'border-2 border-gray-200 bg-white'
          : 'border-2 border-violet-200 bg-gradient-to-b from-violet-50 to-white'
      } ${popular ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-100' : ''}`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-bold text-white">
          인기
        </div>
      )}

      <div className="mb-4">
        <h3 className={`text-lg font-bold ${isOutline ? 'text-gray-900' : 'text-violet-700'}`}>
          {plan.name}
        </h3>
      </div>

      <div className="mb-6">
        {plan.price_per_unit === 0 ? (
          <div className="text-3xl font-bold text-gray-900">무료</div>
        ) : (
          <div className="text-3xl font-bold text-gray-900">
            {plan.price_per_unit.toLocaleString('ko-KR')}
            <span className="text-base font-normal text-gray-500">원/월</span>
          </div>
        )}
      </div>

      <ul className="mb-6 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isOutline ? 'text-gray-400' : 'text-violet-500'}`} />
            {f}
          </li>
        ))}
      </ul>

      {cta.disabled ? (
        <div className="rounded-xl bg-gray-100 py-3 text-center text-sm font-semibold text-gray-500">
          {cta.label}
        </div>
      ) : (
        <Link
          href={cta.href}
          className={`block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
            isOutline
              ? 'border-2 border-violet-600 text-violet-600 hover:bg-violet-50'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
