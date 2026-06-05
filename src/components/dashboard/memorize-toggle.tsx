'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface MemorizeToggleProps {
  studentId: string;
  active: boolean;
}

export function MemorizeToggle({ studentId, active: initial }: MemorizeToggleProps) {
  const [active, setActive] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetchWithToast('/api/service-assignments', {
        method: 'PATCH',
        body: { studentId, naesinMemorizeOnly: !active },
        successMessage: active ? '내신 암기 해제' : '내신 암기 할당',
        errorMessage: '내신 암기 변경에 실패했습니다',
      });
      setActive(!active);
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
        active
          ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border',
      )}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      내신 암기
    </button>
  );
}
