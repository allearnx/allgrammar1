'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';

export default function AllkillPayButton({
  courseId,
  price,
  label = '올킬보카 개인 구독',
  variant = 'primary',
  text = '지금 시작하기 →',
}: {
  courseId?: string;
  price?: number;
  label?: string;
  variant?: 'primary' | 'outline';
  text?: string;
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
      onClick={() => track('checkout_click', { source: 'pricing', label })}
      className="inline-flex w-full h-[58px] items-center justify-center rounded-full font-bold text-[17px] transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
      style={style}
    >
      {text}
    </Link>
  );
}
