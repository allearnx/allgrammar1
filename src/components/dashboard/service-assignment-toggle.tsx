'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface ServiceAssignmentToggleProps {
  studentId: string;
  assignedServices: string[];
  vocaBooks?: { id: string; title: string }[];
  assignedBookId?: string | null;
  round2Unlocked?: boolean;
  showRound2Toggle?: boolean;
  onUpdate?: () => void;
}

const SERVICES = [
  { key: 'naesin', label: '내신' },
  { key: 'voca', label: '올킬보카' },
] as const;

export function ServiceAssignmentToggle({
  studentId,
  assignedServices: initial,
  vocaBooks,
  assignedBookId: initialBookId,
  round2Unlocked: initialRound2 = false,
  showRound2Toggle = false,
  onUpdate,
}: ServiceAssignmentToggleProps) {
  const [assigned, setAssigned] = useState<Set<string>>(new Set(initial));
  const [loading, setLoading] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(initialBookId ?? null);
  const [bookLoading, setBookLoading] = useState(false);
  const [round2, setRound2] = useState(initialRound2);
  const [round2Loading, setRound2Loading] = useState(false);

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

      // 보카 OFF → 교재 배정도 해제
      if (isAssigned && service === 'voca' && bookId) {
        await fetch('/api/voca/book-assignments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId }),
        });
        setBookId(null);
      }

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

  async function handleBookChange(newBookId: string) {
    if (!newBookId) return;
    setBookLoading(true);
    try {
      const res = await fetch('/api/voca/book-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, bookId: newBookId }),
      });
      if (!res.ok) throw new Error();
      setBookId(newBookId);
      const bookTitle = vocaBooks?.find((b) => b.id === newBookId)?.title || '교재';
      toast.success(`${bookTitle} 배정됨`);
      onUpdate?.();
    } catch (err) {
      console.error(err);
      toast.error('교재 배정에 실패했습니다');
    } finally {
      setBookLoading(false);
    }
  }

  async function toggleRound2() {
    setRound2Loading(true);
    try {
      const res = await fetch('/api/service-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, round2Unlocked: !round2 }),
      });
      if (!res.ok) throw new Error();
      setRound2(!round2);
      toast.success(round2 ? '2회독 잠금' : '2회독 해제');
      onUpdate?.();
    } catch {
      toast.error('2회독 변경에 실패했습니다');
    } finally {
      setRound2Loading(false);
    }
  }

  const vocaOn = assigned.has('voca');
  const showBookSelect = vocaOn && vocaBooks && vocaBooks.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      {showBookSelect && (
        <select
          value={bookId || ''}
          onChange={(e) => handleBookChange(e.target.value)}
          disabled={bookLoading}
          className={cn(
            'h-8 rounded-md border border-border bg-background px-2 text-sm',
            bookLoading && 'opacity-50 cursor-wait'
          )}
        >
          <option value="" disabled>교재 선택</option>
          {vocaBooks.map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      )}
      {vocaOn && showRound2Toggle && (
        <button
          type="button"
          disabled={round2Loading}
          onClick={toggleRound2}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none',
            round2Loading && 'opacity-50 cursor-wait',
            round2
              ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
          )}
        >
          {round2 ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          2회독
        </button>
      )}
    </div>
  );
}
