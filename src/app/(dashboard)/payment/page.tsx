'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '';
  const price = Number(searchParams.get('price')) || 0;
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'TossPayments' in window) {
      setSdkReady(true);
    }
  }, []);

  const handlePayment = () => {
    if (!name || price < 100) return;
    // @ts-expect-error -- TossPayments v1 loaded via script tag
    const tp = window.TossPayments?.(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY);
    if (!tp) return;

    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    tp.requestPayment('카드', {
      amount: price,
      orderId,
      orderName: name,
      successUrl: `${window.location.origin}/payment/callback?name=${encodeURIComponent(name)}`,
      failUrl: `${window.location.origin}/payment/callback`,
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
    <>
      <Script
        src="https://js.tosspayments.com/v1/payment"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
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
            <Button onClick={handlePayment} size="lg" className="w-full" disabled={!sdkReady}>
              {sdkReady ? '결제하기' : '결제 모듈 로딩 중...'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
