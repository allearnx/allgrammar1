'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ServiceAssignmentToggleProps {
  studentId: string;
  assignedServices: string[];
  onUpdate?: () => void;
}

const SERVICES = [
  { key: 'naesin', label: '내신' },
  { key: 'voca', label: '올톡보카' },
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

      toast.success(isAssigned ? `${service} 해제됨` : `${service} 배정됨`);
      onUpdate?.();
    } catch {
      toast.error('서비스 배정 변경에 실패했습니다');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-1">
      {SERVICES.map((s) => (
        <Badge
          key={s.key}
          variant={assigned.has(s.key) ? 'default' : 'outline'}
          className={cn(
            'cursor-pointer text-[10px] select-none transition-colors',
            loading === s.key && 'opacity-50',
            assigned.has(s.key)
              ? 'bg-primary hover:bg-primary/80'
              : 'hover:bg-muted'
          )}
          onClick={() => !loading && toggle(s.key)}
        >
          {s.label}
        </Badge>
      ))}
    </div>
  );
}
