'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';
  const name = searchParams.get('name') || '';
  const price = Number(searchParams.get('price')) || 0;
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // home 프로젝트와 동일한 방식: useEffect로 직접 스크립트 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('TossPayments' in window) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => toast.error('결제 모듈을 불러오는데 실패했습니다.');
    document.head.appendChild(script);
  }, []);

  const handlePayment = () => {
    if (!name || price < 100 || loading) return;

    // @ts-expect-error -- TossPayments v1 loaded via script
    const tossPayments = window.TossPayments?.(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY);
    if (!tossPayments) {
      toast.error('결제 모듈이 로드되지 않았습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    setLoading(true);
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    tossPayments.requestPayment('카드', {
      amount: price,
      orderId,
      orderName: name,
      successUrl: `${window.location.origin}/payment/callback?courseId=${encodeURIComponent(courseId)}&name=${encodeURIComponent(name)}`,
      failUrl: `${window.location.origin}/payment/callback`,
    }).catch(() => {
      setLoading(false);
    });
  };

  if (!name || price < 100) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f4f5] p-4">
        <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 text-center">
          <p className="text-gray-500">잘못된 결제 정보입니다.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-[#3182F6] font-medium"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f4f4f5]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="mx-auto flex h-14 max-w-[480px] items-center px-4">
          <button
            onClick={() => router.back()}
            className="mr-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">결제하기</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-[480px] px-4 pb-28 pt-5 space-y-4">
        {/* 주문 상품 */}
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900">주문 상품</h2>
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-gray-800">{name}</span>
            <span className="text-[15px] font-semibold text-gray-900">
              {price.toLocaleString('ko-KR')}원
            </span>
          </div>
        </section>

        {/* 결제 수단 */}
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900">결제 수단</h2>
          <div className="flex items-center gap-3 rounded-xl border-2 border-[#3182F6] bg-[#f0f6ff] px-4 py-3">
            <CreditCard className="h-5 w-5 text-[#3182F6]" />
            <span className="text-[15px] font-medium text-[#3182F6]">카드 결제</span>
          </div>
        </section>

        {/* 결제 정보 */}
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-gray-900">결제 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-500">상품 금액</span>
              <span className="text-[14px] text-gray-700">{price.toLocaleString('ko-KR')}원</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-500">할인</span>
              <span className="text-[14px] text-gray-700">0원</span>
            </div>
            <div className="my-1 border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-gray-900">총 결제 금액</span>
              <span className="text-lg font-bold text-gray-900">
                {price.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-[480px] px-4 py-3 space-y-2">
          <button
            onClick={handlePayment}
            disabled={!sdkReady || loading}
            className="w-full rounded-xl bg-[#3182F6] py-4 text-[16px] font-semibold text-white transition-colors hover:bg-[#1b6ef3] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {!sdkReady
              ? '결제 준비 중...'
              : loading
                ? '결제창 여는 중...'
                : `${price.toLocaleString('ko-KR')}원 결제하기`}
          </button>
          <div className="flex items-center justify-center gap-1.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
            <p className="text-xs text-gray-400">
              안전한 결제를 위해 토스페이먼츠가 결제를 처리합니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
