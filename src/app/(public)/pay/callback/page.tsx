import { Suspense } from 'react';
import { GuestPayCallbackClient } from './callback-client';

export default function GuestPayCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-gray-400">결제 처리 중...</div>}>
      <GuestPayCallbackClient />
    </Suspense>
  );
}
