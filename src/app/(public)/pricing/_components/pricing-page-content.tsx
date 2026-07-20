'use client';

import Link from 'next/link';
import { Check, Crown, Sparkles } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/billing';
import { SeatLadderTable } from '@/components/billing/seat-ladder-table';

interface PricingPageContentProps {
  plans: SubscriptionPlan[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentTier: 'free' | 'paid' | null;
  currentPlanId: string | null;
}

const FEATURES_BY_PLAN: Record<string, string[]> = {
  'Pro 10': ['학생 10명', '올킬보카 전체 (기출 예문·음원)', '어휘 레벨 진단', '학부모 리포트'],
  'Pro 50': ['학생 50명', '올킬보카 전체 (기출 예문·음원)', '어휘 레벨 진단', '대량 관리', '학부모 리포트'],
  'Pro 100': ['학생 100명', '올킬보카 전체 (기출 예문·음원)', '어휘 레벨 진단', '대량 관리', '학부모 리포트'],
  'Pro 180': ['학생 180명', '올킬보카 전체 (기출 예문·음원)', '어휘 레벨 진단', '대량 관리', '학부모 리포트'],
};

export function PricingPageContent({
  plans,
  isLoggedIn,
  isAdmin,
  currentTier,
  currentPlanId,
}: PricingPageContentProps) {
  // 무료 티어는 노출하지 않음 (2026-07-20 사장님 결정) — 유료 플랜만 표시
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
          학원 규모에 맞는 플랜으로 시작하세요
        </p>
      </div>

      {/* Price Cards */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-3">
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

      {/* 5명 단위 상세 요금표 (10~180명, 전 구간 정식 요금) */}
      <div className="mx-auto max-w-2xl px-4 mt-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          학생 수별 상세 요금
        </h2>
        <p className="text-center text-gray-500 mb-8">
          5명 단위로 딱 맞는 인원을 선택하세요
        </p>
        <SeatLadderTable />
        <p className="text-xs text-gray-400 mt-3 text-center">
          가입 후 카카오톡 채널 [올라영]으로 인원을 알려주시면 해당 요금으로 시작해드립니다.
        </p>
      </div>

      {/* 모든 플랜 포함 기능 */}
      <div className="mx-auto max-w-3xl px-4 mt-20">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          모든 플랜에 전부 포함
        </h2>
        <p className="text-center text-gray-500 mb-8">
          플랜은 학생 수만 다릅니다. 기능 제한은 없어요.
        </p>
        <div className="rounded-2xl border border-violet-100 bg-white px-6 py-6">
          <ul className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
            {[
              '단어 암기 7단계 통과 시스템 (카드·퀴즈·스펠링·매칭)',
              '모의고사·수능 기출 문장 예문 + 원어민 음원',
              '어휘 레벨 진단 (학년 대비 수준·커버리지)',
              'AI 서술형 · 영작 채점',
              '오답 자동 관리 (3연속 정답까지)',
              '학부모 리포트 (링크 공유)',
              '실시간 학습 모니터',
              '선생님 대시보드 · 대량 학생 관리',
            ].map((label) => (
              <li key={label} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">✓</span>
                {label}
              </li>
            ))}
          </ul>
        </div>
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
