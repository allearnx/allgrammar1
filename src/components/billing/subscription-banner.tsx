'use client';

import { AlertTriangle, CreditCard, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionStatus } from '@/types/billing';
import type { Tier } from '@/lib/billing/feature-gate';

interface SubscriptionBannerProps {
  status: SubscriptionStatus;
  trialDaysLeft?: number;
  billingPageHref: string;
  tier?: Tier;
  freeService?: 'naesin' | 'voca' | null;
}

export function SubscriptionBanner({ status, trialDaysLeft, billingPageHref, tier, freeService }: SubscriptionBannerProps) {
  // Free tier banner
  if (tier === 'free') {
    const serviceLabel = freeService === 'voca' ? '올킬보카' : '올인내신';
    return (
      <div className="bg-violet-50 border-b border-violet-200 px-4 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-violet-700">
          <Sparkles className="h-4 w-4" />
          <span>무료 플랜 사용 중 (5명, {serviceLabel}만 이용 가능)</span>
        </div>
        <Link
          href={billingPageHref}
          className="flex items-center gap-1 text-violet-700 font-semibold hover:underline"
        >
          업그레이드 &rarr;
        </Link>
      </div>
    );
  }

  if (status === 'active') return null;

  if (status === 'trialing') {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-blue-700">
          <Clock className="h-4 w-4" />
          <span>무료 체험 중 ({trialDaysLeft ?? 0}일 남음)</span>
        </div>
        <Link
          href={billingPageHref}
          className="flex items-center gap-1 text-blue-700 font-medium hover:underline"
        >
          <CreditCard className="h-4 w-4" />
          결제 수단 등록
        </Link>
      </div>
    );
  }

  if (status === 'past_due') {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span>결제 실패 — 서비스가 곧 중단될 수 있습니다</span>
        </div>
        <Link
          href={billingPageHref}
          className="text-red-700 font-medium hover:underline"
        >
          결제 수단 업데이트
        </Link>
      </div>
    );
  }

  if (status === 'expired' || status === 'canceled') {
    return (
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <AlertTriangle className="h-4 w-4" />
          <span>구독이 만료되었습니다</span>
        </div>
        <Link
          href={billingPageHref}
          className="text-primary font-medium hover:underline"
        >
          다시 구독하기
        </Link>
      </div>
    );
  }

  return null;
}
