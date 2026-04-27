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
            i === current && 'bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.5)]',
            i !== current && visited?.has(i) && 'bg-slate-500',
            i !== current && !visited?.has(i) && (i < current ? 'bg-slate-500' : 'bg-slate-700'),
          )}
        />
      ))}
    </div>
  );
}
