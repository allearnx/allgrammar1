'use client';

import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PremiumGateProps {
  allowed: boolean;
  feature: string;
  role: 'admin' | 'student' | 'teacher' | 'boss';
  children: React.ReactNode;
}

export function PremiumGate({ allowed, feature, role, children }: PremiumGateProps) {
  if (allowed) return <>{children}</>;

  const isAdmin = role === 'admin' || role === 'boss';

  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-xl">
      {/* Blurred real content */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(8px)', opacity: 0.6 }}>
        {children}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 100%)',
          backdropFilter: 'blur(2px)',
        }}
      >
        {/* Glassmorphic card */}
        <div className="max-w-sm w-[90%] text-center">
          <div
            className="rounded-2xl p-[1.5px]"
            style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #06B6D4 100%)' }}
          >
            <div className="rounded-[15px] bg-white/95 backdrop-blur-xl p-7">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)' }}
              >
                <Lock className="h-6 w-6 text-violet-500" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                {isAdmin ? '프리미엄 기능입니다' : '프리미엄 기능이에요'}
              </h3>
              <p className="mt-1.5 text-sm text-gray-500">
                <span className="font-medium text-violet-600">{feature}</span>
                {isAdmin
                  ? '은(는) 유료 플랜에서 사용할 수 있습니다.'
                  : '은(는) 프리미엄 기능이에요. 관리자에게 업그레이드를 요청하세요.'}
              </p>

              {isAdmin && (
                <Link
                  href="/pricing"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  요금제 보기
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
