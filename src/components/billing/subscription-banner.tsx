'use client';

import { AlertTriangle, CreditCard, Clock } from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionStatus } from '@/types/billing';

interface SubscriptionBannerProps {
  status: SubscriptionStatus;
  trialDaysLeft?: number;
  billingPageHref: string;
}

export function SubscriptionBanner({ status, trialDaysLeft, billingPageHref }: SubscriptionBannerProps) {
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
