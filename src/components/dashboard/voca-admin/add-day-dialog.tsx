'use client';

import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { VocaDay } from '@/types/voca';
import { logger } from '@/lib/logger';

export function AddDayDialog({ bookId, nextDayNumber, onAdd }: { bookId: string; nextDayNumber: number; onAdd: (day: VocaDay) => void }) {
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
    } catch (err) {
      logger.error('voca_admin.add_day', { error: err instanceof Error ? err.message : String(err) });
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
