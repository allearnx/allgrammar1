'use client';

import { cn } from '@/lib/utils';

interface ProgressDotsProps {
  total: number;
  current: number;
  visited?: Set<number>;
}

export function ProgressDots({ total, current, visited }: ProgressDotsProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-2 h-2 rounded-full transition-colors',
            i === current && 'bg-brand-500',
            i !== current && visited?.has(i) && 'bg-gray-400',
            i !== current && !visited?.has(i) && (i < current ? 'bg-gray-400' : 'bg-gray-200'),
          )}
        />
      ))}
    </div>
  );
}
