'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PaymentPage() {
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
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <p className="text-muted-foreground">잘못된 결제 정보입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>수업 결제</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">{name}</p>
            <p className="text-3xl font-bold">
              {price.toLocaleString('ko-KR')}원
            </p>
          </div>
          <Button
            onClick={handlePayment}
            size="lg"
            className="w-full"
            disabled={!sdkReady || loading}
          >
            {!sdkReady ? '결제 모듈 로딩 중...' : loading ? '결제창 여는 중...' : '결제하기'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
