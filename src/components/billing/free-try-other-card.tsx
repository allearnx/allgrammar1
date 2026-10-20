'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { freeWelcomeSeenKey } from '@/components/billing/free-welcome-modal';
import { FREE_SERVICE_INFO, otherFreeService, type FreeServiceKey } from '@/lib/billing/free-service-info';

/**
 * 무료 학생에게 "다른 서비스도 써 보세요" 카드.
 * 그 서비스에 한 번 들어가 환영 팝업을 본 뒤로는 숨긴다 (같은 저장 키).
 */
export function FreeTryOtherCard({ current, userId }: { current: FreeServiceKey; userId: string }) {
  const otherKey = otherFreeService(current);
  const other = FREE_SERVICE_INFO[otherKey];
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(!localStorage.getItem(freeWelcomeSeenKey(otherKey, userId)));
    } catch { /* 저장소를 못 쓰면 숨김 */ }
  }, [otherKey, userId]);

  if (!show) return null;

  return (
    <Link
      href={other.href}
      className="group flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF]">
        <Sparkles className="h-4 w-4 text-[#3182F6]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-gray-800">
          {other.label}도 무료로 써 보세요
          <span className="ml-1.5 rounded-full bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-bold text-[#3182F6]">무료 체험</span>
        </span>
        <span className="block truncate text-xs text-gray-500">{other.tagline} · {other.freeScope}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
