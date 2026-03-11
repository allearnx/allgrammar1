'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface ServiceAssignmentToggleProps {
  studentId: string;
  assignedServices: string[];
  onUpdate?: () => void;
}

const SERVICES = [
  { key: 'naesin', label: '내신' },
  { key: 'voca', label: '올킬보카' },
] as const;

export function ServiceAssignmentToggle({
  studentId,
  assignedServices: initial,
  onUpdate,
}: ServiceAssignmentToggleProps) {
  const [assigned, setAssigned] = useState<Set<string>>(new Set(initial));
  const [loading, setLoading] = useState<string | null>(null);

  async function toggle(service: string) {
    const isAssigned = assigned.has(service);
    setLoading(service);

    try {
      const res = await fetch('/api/service-assignments', {
        method: isAssigned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, service }),
      });

      if (!res.ok) throw new Error();

      setAssigned((prev) => {
        const next = new Set(prev);
        if (isAssigned) next.delete(service);
        else next.add(service);
        return next;
      });

      const label = SERVICES.find((s) => s.key === service)?.label || service;
      toast.success(isAssigned ? `${label} 해제됨` : `${label} 배정됨`);
      onUpdate?.();
    } catch (err) {
      console.error(err);
      toast.error('서비스 배정 변경에 실패했습니다');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      {SERVICES.map((s) => {
        const active = assigned.has(s.key);
        return (
          <button
            key={s.key}
            type="button"
            disabled={loading === s.key}
            onClick={() => toggle(s.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none',
              loading === s.key && 'opacity-50 cursor-wait',
              active
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
            )}
          >
            {active ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
