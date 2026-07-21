'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GUEST_KEY = 'guest_payment_info';

export function GuestPayCallbackClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const orderName = searchParams.get('name');
    const courseId = searchParams.get('courseId');

    if (!paymentKey || !orderId || !amount) {
      const code = searchParams.get('code');
      const message = searchParams.get('message');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      setErrorMessage(message || code || '결제에 실패했습니다');
      return;
    }

    let guest: { guestName?: string; guestPhone?: string } = {};
    try {
      guest = JSON.parse(sessionStorage.getItem(GUEST_KEY) || '{}');
    } catch { /* ignore */ }

    if (!guest.guestName || !guest.guestPhone) {
      setStatus('error');
      setErrorMessage('결제자 정보가 만료되었습니다. 다시 시도해주세요.');
      return;
    }

    async function confirm() {
      try {
        const res = await fetch('/api/payment/guest-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            orderName: orderName || '',
            ...(courseId ? { courseId } : {}),
            guestName: guest.guestName,
            guestPhone: guest.guestPhone,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          sessionStorage.removeItem(GUEST_KEY);
          setStatus('success');
          setReceiptUrl(data.receiptUrl ?? null);
        } else {
          setStatus('error');
          setErrorMessage(data.error || '결제 승인 실패');
        }
      } catch {
        setStatus('error');
        setErrorMessage('네트워크 오류가 발생했습니다');
      }
    }

    confirm();
  }, [searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>결제 처리</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">결제 승인 처리 중...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">결제 완료!</p>
              {receiptUrl && (
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                  영수증 보기
                </a>
              )}
              <p className="text-sm text-muted-foreground text-center">결제해 주셔서 감사합니다.</p>
              {searchParams.get('name')?.includes('올킬보카') && (
                <Button asChild>
                  <Link href="/student/voca">올킬보카 학습하러 가기</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/">홈으로</Link>
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium">결제 실패</p>
              <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
              <Button onClick={() => window.history.back()}>돌아가기</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
