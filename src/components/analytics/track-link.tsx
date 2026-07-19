'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import type { ComponentProps } from 'react';

interface TrackLinkProps extends ComponentProps<typeof Link> {
  /** Vercel Analytics 커스텀 이벤트 이름 */
  event: string;
  eventProps?: Record<string, string | number>;
}

/** 클릭 시 Vercel Analytics 이벤트를 남기는 Link — 서버 컴포넌트(랜딩 섹션 등)에서 사용 */
export function TrackLink({ event, eventProps, onClick, ...props }: TrackLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
