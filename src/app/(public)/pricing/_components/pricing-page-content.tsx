'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/billing';
import { SeatPicker } from '@/components/billing/seat-picker';

// 구글 팔레트 (디자인 정책: 보라 금지 — google-style-migration)
const G = {
  blue: '#1A73E8',
  blueDark: '#174EA6',
  blueLight: '#E8F0FE',
  sky: '#DFEFFF',
  yellow: '#FDD663',
  ink: '#1F1F1F',
};

interface PricingPageContentProps {
  plans: SubscriptionPlan[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentTier: 'free' | 'paid' | null;
  currentPlanId: string | null;
}

const INCLUDED_FEATURES = [
  '단어 암기 7단계 통과 시스템 (카드·퀴즈·스펠링·매칭)',
  '모의고사·수능 기출 문장 예문 + 원어민 음원',
  '어휘 레벨 진단 (학년 대비 수준·커버리지)',
  'AI 서술형 · 영작 채점',
  '오답 자동 관리 (3연속 정답까지)',
  '학부모 리포트 (링크 공유)',
  '실시간 학습 모니터',
  '선생님 대시보드 · 대량 학생 관리',
];

export function PricingPageContent({
  plans,
  isLoggedIn,
  isAdmin,
  currentTier,
}: PricingPageContentProps) {
  const paidPlans = plans.filter((p) => p.price_per_unit > 0);
  const pickerCta = !isLoggedIn || !isAdmin ? 'signup' : currentTier === 'paid' ? 'contact' : 'upgrade';
  const isFreeAdmin = isLoggedIn && isAdmin && currentTier !== 'paid';

  return (
    <div className="pt-28 pb-20">
      {/* Hero */}
      <div className="mx-auto max-w-4xl px-4 text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ background: G.blueLight }}>
          <span className="text-sm font-bold" style={{ color: G.blueDark }}>학원 전용 요금제</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          학원 맞춤 요금제
        </h1>
        <p className="text-lg text-gray-500">
          먼저 무료로 체험하고, 학생 수만 골라 시작하세요
        </p>
      </div>

      {/* ① 무료 체험 우선 — 결제보다 체험이 먼저 */}
      <div className="mx-auto max-w-2xl px-4 mb-14">
        <div className="rounded-3xl px-8 py-8 text-center" style={{ background: G.sky }}>
          <h2 className="text-2xl font-bold" style={{ color: G.ink }}>
            먼저 무료로 시작하세요
          </h2>
          <p className="mt-2 text-[15px] text-gray-600">
            <b style={{ color: G.ink }}>학생 5명, Day 3개</b>까지 무료 체험 · 카드 등록 없음
          </p>
          {isFreeAdmin ? (
            <p className="mt-4 text-sm font-semibold" style={{ color: G.blueDark }}>
              이미 체험 중이에요 — 아래에서 학생 수를 선택해 업그레이드하세요
            </p>
          ) : (
            <Link
              href="/signup?role=admin"
              className="mt-5 inline-block rounded-full px-10 py-3.5 text-base font-bold transition-transform hover:scale-[1.02]"
              style={{ background: G.yellow, color: G.ink }}
            >
              가입하고 무료 체험 시작
            </Link>
          )}
        </div>
      </div>

      {/* ② 학생 수 선택 → 결제 */}
      <div className="mx-auto max-w-md px-4">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          유료 전환은 학생 수만 고르면 끝
        </h2>
        <p className="text-center text-gray-500 mb-6">
          5명 단위로 선택하면 요금이 바로 계산돼요
        </p>
        <SeatPicker plans={paidPlans} cta={pickerCta} />
      </div>

      {/* ③ 포함 기능 */}
      <div className="mx-auto max-w-3xl px-4 mt-20">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          모든 플랜에 전부 포함
        </h2>
        <p className="text-center text-gray-500 mb-8">
          플랜은 학생 수만 다릅니다. 기능 제한은 없어요.
        </p>
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6">
          <ul className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
            {INCLUDED_FEATURES.map((label) => (
              <li key={label} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: G.blueLight, color: G.blue }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ⑤ 대규모 문의 */}
      <div className="mx-auto max-w-2xl px-4 mt-16 text-center">
        <div className="rounded-2xl px-8 py-8" style={{ background: G.blueLight }}>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            180명보다 큰 학원이신가요?
          </h3>
          <p className="text-gray-600 mb-5">
            대규모 학원은 맞춤 견적을 드려요.
          </p>
          <a
            href="http://pf.kakao.com/_iLxcLG/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#FEE500', color: '#3C1E1E' }}
          >
            카톡으로 문의하기
          </a>
        </div>
      </div>
    </div>
  );
}
