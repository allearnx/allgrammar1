'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
      <h2 className="text-xl font-semibold">문제가 발생했습니다</h2>
      <p className="text-muted-foreground text-center">
        페이지를 불러오는 중 오류가 발생했습니다.
      </p>
      <Button onClick={reset} variant="outline">
        다시 시도
      </Button>
    </div>
  );
}
