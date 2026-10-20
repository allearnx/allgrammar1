'use client';

import { AlertTriangle, CreditCard, Clock, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionStatus } from '@/types/billing';
import type { Tier } from '@/lib/billing/feature-gate';

interface SubscriptionBannerProps {
  status: SubscriptionStatus;
  trialDaysLeft?: number;
  billingPageHref: string;
  tier?: Tier;
  freeService?: 'naesin' | 'voca' | null;
  isIndividual?: boolean;
  /** 학생 화면이면 true — 무료 문구를 학생용으로 */
  forStudent?: boolean;
}

const BANNER_STYLES = {
  free: { bg: 'bg-[#EFF6FF]', border: 'border-blue-100', text: 'text-[#3182F6]', icon: Sparkles },
  trialing: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: Clock },
  past_due: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: AlertTriangle },
  expired: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', icon: AlertTriangle },
} as const;

export function SubscriptionBanner({ status, trialDaysLeft, billingPageHref, tier, freeService, isIndividual, forStudent }: SubscriptionBannerProps) {
  if (tier === 'free') {
    return (
      <FreeBanner
        freeService={freeService}
        isIndividual={isIndividual}
        forStudent={forStudent}
      />
    );
  }

  if (status === 'active') return null;

  type BannerKey = 'trialing' | 'past_due' | 'expired';
  const key: BannerKey = status === 'trialing' ? 'trialing' : status === 'past_due' ? 'past_due' : 'expired';
  const s = BANNER_STYLES[key];
  const Icon = s.icon;

  const messages: Record<BannerKey, { msg: string; action: string; href: string }> = {
    trialing: { msg: `무료 체험 중 · ${trialDaysLeft ?? 0}일 남음`, action: '결제 수단 등록', href: billingPageHref },
    past_due: { msg: '결제 실패 — 서비스가 곧 중단될 수 있습니다', action: '결제 수단 업데이트', href: billingPageHref },
    expired: { msg: '구독이 만료되었습니다', action: '다시 구독하기', href: billingPageHref },
  };

  if (status !== 'trialing' && status !== 'past_due' && status !== 'expired' && status !== 'canceled') return null;
  const m = messages[key];

  return (
    <div className={`${s.bg} border-b ${s.border} px-5 py-3 flex items-center justify-between`}>
      <div className={`flex items-center gap-2.5 ${s.text} text-[13px] font-medium`}>
        <Icon className="h-4 w-4" />
        <span>{m.msg}</span>
      </div>
      <Link href={m.href} className={`flex items-center gap-1 ${s.text} text-[13px] font-semibold hover:opacity-70 transition-opacity`}>
        {status === 'trialing' && <CreditCard className="h-3.5 w-3.5" />}
        {m.action} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function FreeBanner({ freeService, isIndividual, forStudent }: { freeService?: 'naesin' | 'voca' | null; isIndividual?: boolean; forStudent?: boolean }) {
  // 2026-07부터 무료도 양쪽 서비스가 열려 있어 '전환' 버튼은 없앴다.
  // 학생에게는 둘 다 체험 중이라고, 학원 결제 화면에는 기존 학원 플랜 문구를 보여 준다.
  const serviceLabel = freeService === 'voca' ? '올킬보카' : '올인내신';
  const description = forStudent
    ? '무료 플랜 · 올킬보카·올인내신 체험 중'
    : isIndividual
      ? `무료 플랜 사용 중 · ${serviceLabel} 1회독`
      : `무료 플랜 사용 중 · 5명, ${serviceLabel}만 이용 가능`;
  const s = BANNER_STYLES.free;
  const Icon = s.icon;
  // 학원 학생은 직접 결제하지 않으므로 업그레이드 링크 대신 안내만
  const showUpgrade = !forStudent || isIndividual;

  return (
    <div className={`${s.bg} border-b ${s.border} px-5 py-3 flex items-center justify-between gap-3`}>
      <div className={`flex items-center gap-2.5 ${s.text} text-[13px] font-medium`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span>{description}</span>
      </div>
      {showUpgrade ? (
        <Link href="/pricing" className={`flex shrink-0 items-center gap-1 ${s.text} text-[13px] font-semibold hover:opacity-70 transition-opacity`}>
          업그레이드 <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className={`shrink-0 ${s.text} text-[12px] opacity-80`}>더 쓰려면 선생님께 문의</span>
      )}
    </div>
  );
}
