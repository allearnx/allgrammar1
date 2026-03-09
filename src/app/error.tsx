'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-destructive">오류 발생</h1>
        <p className="text-muted-foreground mt-2">
          예기치 않은 오류가 발생했습니다.
        </p>
        <Button onClick={reset} className="mt-6">
          다시 시도
        </Button>
      </div>
    </div>
  );
}
