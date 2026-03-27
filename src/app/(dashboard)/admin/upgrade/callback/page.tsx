'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UpgradeCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const planId = searchParams.get('planId');

    if (!paymentKey || !orderId || !amount || !planId) {
      const code = searchParams.get('code');
      const message = searchParams.get('message');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      setErrorMessage(message || code || '결제에 실패했습니다');
      return;
    }

    async function confirm() {
      try {
        const res = await fetch('/api/admin/upgrade-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            planId,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          toast.success('업그레이드가 완료되었습니다');
        } else {
          setStatus('error');
          setErrorMessage(data.error || '업그레이드 처리 실패');
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
          <CardTitle>업그레이드 처리</CardTitle>
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
              <p className="text-lg font-medium">업그레이드 완료!</p>
              <p className="text-sm text-muted-foreground text-center">
                유료 요금제로 전환되었습니다. 모든 기능을 이용하실 수 있습니다.
              </p>
              <Button asChild>
                <Link href="/admin">대시보드로 가기</Link>
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium">업그레이드 실패</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/pricing">요금제 보기</Link>
                </Button>
                <Button onClick={() => window.history.back()}>돌아가기</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
