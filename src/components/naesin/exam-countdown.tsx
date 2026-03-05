'use client';

import { Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamCountdownProps {
  examDate: string;
  className?: string;
}

/**
 * D-day countdown banner:
 * - D-7+ = blue (calm)
 * - D-3~7 = yellow (warning)
 * - D-3 or less = red (urgent)
 * - D-day = special display
 * - Past = gray
 */
export function ExamCountdown({ examDate, className }: ExamCountdownProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const diffMs = exam.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let label: string;
  let colorClasses: string;

  if (diffDays < 0) {
    label = `시험 종료 (${Math.abs(diffDays)}일 전)`;
    colorClasses = 'bg-gray-100 text-gray-600 border-gray-300';
  } else if (diffDays === 0) {
    label = 'D-Day';
    colorClasses = 'bg-red-100 text-red-800 border-red-400';
  } else if (diffDays <= 3) {
    label = `D-${diffDays}`;
    colorClasses = 'bg-red-100 text-red-800 border-red-400';
  } else if (diffDays <= 7) {
    label = `D-${diffDays}`;
    colorClasses = 'bg-yellow-100 text-yellow-800 border-yellow-400';
  } else {
    label = `D-${diffDays}`;
    colorClasses = 'bg-blue-100 text-blue-800 border-blue-400';
  }

  const formattedDate = exam.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3',
        colorClasses,
        className
      )}
    >
      {diffDays <= 3 && diffDays >= 0 ? (
        <AlertTriangle className="h-5 w-5 shrink-0" />
      ) : (
        <Calendar className="h-5 w-5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs opacity-80">시험일: {formattedDate}</p>
      </div>
      <span className="text-2xl font-bold shrink-0">{diffDays >= 0 ? label : ''}</span>
    </div>
  );
}
