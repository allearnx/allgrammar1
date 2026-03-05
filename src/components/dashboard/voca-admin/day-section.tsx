'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DayContentManager } from './day-content-manager';
import type { VocaBook, VocaDay } from '@/types/voca';

interface DaySectionProps {
  book: VocaBook;
  days: VocaDay[];
  expandedDay: string | null;
  onToggleDay: (dayId: string) => void;
  onAddDay: (day: VocaDay) => void;
  onDeleteDay: (dayId: string) => void;
}

export function DaySection({ book, days, expandedDay, onToggleDay, onAddDay, onDeleteDay }: DaySectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{book.title} - Day 목록</h3>
        <AddDayDialog bookId={book.id} nextDayNumber={days.length + 1} onAdd={onAddDay} />
      </div>

      {days.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          Day가 없습니다. Day를 추가해주세요.
        </p>
      ) : (
        <div className="space-y-2">
          {days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              expanded={expandedDay === day.id}
              onToggle={() => onToggleDay(day.id)}
              onDelete={() => onDeleteDay(day.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddDayDialog({ bookId, nextDayNumber, onAdd }: { bookId: string; nextDayNumber: number; onAdd: (day: VocaDay) => void }) {
  const [open, setOpen] = useState(false);
  const [dayNumber, setDayNumber] = useState(String(nextDayNumber));
  const [title, setTitle] = useState(`Day ${nextDayNumber}`);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/voca/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          day_number: Number(dayNumber),
          title: title.trim(),
          sort_order: Number(dayNumber),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd(data);
      setOpen(false);
      const next = Number(dayNumber) + 1;
      setDayNumber(String(next));
      setTitle(`Day ${next}`);
      toast.success('Day가 추가되었습니다');
    } catch {
      toast.error('Day 추가 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Day 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Day 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Day 번호</Label>
            <Input
              type="number"
              value={dayNumber}
              onChange={(e) => {
                setDayNumber(e.target.value);
                setTitle(`Day ${e.target.value}`);
              }}
              min={1}
            />
          </div>
          <div>
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving || !title.trim()}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DayCard({
  day,
  expanded,
  onToggle,
  onDelete,
}: {
  day: VocaDay;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onToggle} className="flex items-center gap-2 text-left flex-1">
            {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            <span className="font-medium">{day.title}</span>
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {expanded && <DayContentManager dayId={day.id} />}
      </CardContent>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        description="이 Day를 삭제하시겠습니까? 포함된 모든 단어도 삭제됩니다."
        onConfirm={async () => {
          setDeleteOpen(false);
          try {
            const res = await fetch('/api/voca/days', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: day.id }),
            });
            if (res.ok) onDelete();
            else toast.error('Day 삭제에 실패했습니다');
          } catch {
            toast.error('Day 삭제 중 오류가 발생했습니다');
          }
        }}
      />
    </Card>
  );
}
