'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { DayContentManager } from './day-content-manager';
import { PdfBulkExtract } from './pdf-bulk-extract';
import { BookExamSentenceMatch } from './book-exam-sentence-match';
import { AddDayDialog } from './add-day-dialog';
import type { VocaBook, VocaDay } from '@/types/voca';

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
  // 같은 day_number가 2개 이상 = 중복 Day — 플래시카드/시험이 서로 다른 사본을
  // 가리켜 "안 배운 단어가 시험에 나오는" 사고의 원인. 눈에 띄게 경고한다.
  const numberCounts = new Map<number, number>();
  for (const d of days) numberCounts.set(d.day_number, (numberCounts.get(d.day_number) ?? 0) + 1);

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{book.title} - Day 목록</h3>
        <div className="flex items-center gap-2">
          {days.length > 0 && <BookExamSentenceMatch days={days} onDone={onDaysCreated} />}
          <PdfBulkExtract bookId={book.id} definitionLang={book.definition_lang} onCreated={onDaysCreated} />
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
              definitionLang={book.definition_lang}
              expanded={expandedDay === day.id}
              onToggle={() => onToggleDay(day.id)}
              onDelete={() => onDeleteDay(day.id)}
              isDuplicate={(numberCounts.get(day.day_number) ?? 0) > 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayCard({
  day,
  definitionLang,
  expanded,
  onToggle,
  onDelete,
  isDuplicate,
}: {
  day: VocaDay;
  definitionLang: 'ko' | 'en';
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isDuplicate?: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onToggle} className="flex items-center gap-2 text-left flex-1">
            {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            <span className="font-medium">{day.title}</span>
            {isDuplicate && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                ⚠️ 중복 Day — 시험 오배정 위험, 하나로 정리 필요
              </span>
            )}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {expanded && <DayContentManager dayId={day.id} definitionLang={definitionLang} />}
      </CardContent>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        description="이 Day를 삭제하시겠습니까? 포함된 모든 단어도 삭제됩니다."
        onConfirm={async () => {
          setDeleteOpen(false);
          try {
            await fetchWithToast('/api/voca/days', {
              method: 'DELETE',
              body: { id: day.id },
              errorMessage: 'Day 삭제에 실패했습니다',
              logContext: 'voca_admin.day_section',
            });
            onDelete();
          } catch {
            // fetchWithToast already shows toast
          }
        }}
      />
    </Card>
  );
}
