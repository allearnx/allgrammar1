'use client';

import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageProgressBarProps {
  label: string;
  percent: number;
  className?: string;
}

/**
 * Stage progress bar with color coding:
 * - 0% = gray
 * - 1-79% = purple (#6D28D9)
 * - 80-99% = green (#16A34A)
 * - 100% = green + check icon
 */
export function StageProgressBar({ label, percent, className }: StageProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  const barColor =
    clamped === 0
      ? 'bg-gray-300'
      : clamped < 80
        ? 'bg-purple-600'
        : 'bg-green-600';

  const textColor =
    clamped === 0
      ? 'text-gray-500'
      : clamped < 80
        ? 'text-purple-700'
        : 'text-green-700';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-medium flex items-center gap-1', textColor)}>
          {clamped === 100 && <CheckCircle className="h-3 w-3" />}
          {clamped}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
