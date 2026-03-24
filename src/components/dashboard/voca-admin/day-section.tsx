'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DayContentManager } from './day-content-manager';
import { PdfBulkExtract } from './pdf-bulk-extract';
import { AddDayDialog } from './add-day-dialog';
import type { VocaBook, VocaDay } from '@/types/voca';
import { logger } from '@/lib/logger';

interface DaySectionProps {
  book: VocaBook;
  days: VocaDay[];
  expandedDay: string | null;
  onToggleDay: (dayId: string) => void;
  onAddDay: (day: VocaDay) => void;
  onDeleteDay: (dayId: string) => void;
  onDaysCreated: () => void;
}

export function DaySection({ book, days, expandedDay, onToggleDay, onAddDay, onDeleteDay, onDaysCreated }: DaySectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{book.title} - Day 목록</h3>
        <div className="flex items-center gap-2">
          <PdfBulkExtract bookId={book.id} onCreated={onDaysCreated} />
          <AddDayDialog bookId={book.id} nextDayNumber={days.length + 1} onAdd={onAddDay} />
        </div>
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
          } catch (err) {
            logger.error('voca_admin.day_section', { error: err instanceof Error ? err.message : String(err) });
            toast.error('Day 삭제 중 오류가 발생했습니다');
          }
        }}
      />
    </Card>
  );
}
