'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LevelsError({
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
      <h2 className="text-xl font-semibold">문법 레벨 로딩 오류</h2>
      <p className="text-muted-foreground text-center">
        문법 레벨 데이터를 불러오는 중 오류가 발생했습니다.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">
          다시 시도
        </Button>
        <Button asChild variant="ghost">
          <Link href="/student/levels">레벨 목록으로</Link>
        </Button>
      </div>
    </div>
  );
}
