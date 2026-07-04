'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface RoundModeToggleProps {
  studentId: string;
  mode: 'book' | 'day';
}

export function RoundModeToggle({ studentId, mode: initial }: RoundModeToggleProps) {
  const [mode, setMode] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = mode === 'book' ? 'day' : 'book';
    setLoading(true);
    try {
      await fetchWithToast('/api/service-assignments', {
        method: 'PATCH',
        body: { studentId, vocaRoundMode: next },
        successMessage: next === 'book' ? '책 전체 모드' : 'Day별 완벽 모드',
        errorMessage: '학습 모드 변경에 실패했습니다',
      });
      setMode(next);
    } catch {
      // fetchWithToast already showed toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={toggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none',
        loading && 'opacity-50 cursor-wait',
        mode === 'day'
          ? 'bg-brand-500 text-white shadow-sm hover:bg-brand-600'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border',
      )}
    >
      {mode === 'day' ? 'Day별 완벽' : '책 전체'}
    </button>
  );
}
