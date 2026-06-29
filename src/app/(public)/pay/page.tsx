import { Suspense } from 'react';
import { GuestPayClient } from './pay-client';

export default function GuestPayPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-[#f4f4f5] text-gray-400">결제 준비 중...</div>}>
      <GuestPayClient />
    </Suspense>
  );
}
