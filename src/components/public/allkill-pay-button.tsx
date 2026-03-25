'use client';

import Link from 'next/link';

export default function AllkillPayButton({ courseId }: { courseId?: string }) {
  const paymentUrl = courseId
    ? `/payment?courseId=${courseId}&name=${encodeURIComponent('올킬보카 개인 구독')}&price=9900`
    : '/courses';

  return (
    <Link
      href={paymentUrl}
      className="inline-block w-full text-center px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
      style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #4DD9C0 100%)' }}
    >
      지금 시작하기 &rarr;
    </Link>
  );
}
