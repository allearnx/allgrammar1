'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const authKey = searchParams.get('authKey');
    const customerKey = searchParams.get('customerKey');

    if (!authKey || !customerKey) {
      // 실패 콜백
      const code = searchParams.get('code');
      const message = searchParams.get('message');
      setStatus('error');
      setErrorMessage(message || code || '카드 등록에 실패했습니다');
      return;
    }

    // 성공 콜백 → 빌링키 발급
    fetch('/api/billing/register-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey, customerKey }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('success');
          toast.success('카드가 등록되었습니다');
        } else {
          const data = await res.json();
          setStatus('error');
          setErrorMessage(data.error || '카드 등록 실패');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('네트워크 오류가 발생했습니다');
      });
  }, [searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>카드 등록</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">카드 등록 처리 중...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">카드 등록 완료!</p>
              <Button onClick={() => router.back()}>돌아가기</Button>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium">카드 등록 실패</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => router.back()}>돌아가기</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
