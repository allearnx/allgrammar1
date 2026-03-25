'use client';

import Link from 'next/link';

export default function SinaeSinPayButton({ courseId, price, name }: { courseId?: string; price?: number; name?: string }) {
  const paymentUrl = courseId && price
    ? `/payment?courseId=${courseId}&name=${encodeURIComponent(name || '올인내신')}&price=${price}`
    : '/courses';

  return (
    <Link
      href={paymentUrl}
      className="sinaesin-pricing-cta"
    >
      결제하기 &rarr;
    </Link>
  );
}
