'use client';

import Link from 'next/link';

export default function AllkillPayButton({
  courseId,
  price,
  label = '올킬보카 개인 구독',
  variant = 'primary',
}: {
  courseId?: string;
  price?: number;
  label?: string;
  variant?: 'primary' | 'outline';
}) {
  const paymentUrl = courseId && price
    ? `/payment?courseId=${courseId}&name=${encodeURIComponent(label)}&price=${price}`
    : '/courses';

  const style = variant === 'primary'
    ? { background: '#FDD663', color: '#1F1F1F' }
    : { background: 'white', color: '#1F1F1F', border: '1.5px solid #DADCE0' };

  return (
    <Link
      href={paymentUrl}
      className="inline-block w-full text-center px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
      style={style}
    >
      지금 시작하기 &rarr;
    </Link>
  );
}
