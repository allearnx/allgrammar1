'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';

interface ExamDatePickerProps {
  textbookId: string;
  currentDate?: string | null;
  onDateChange: (date: string) => void;
}

export function ExamDatePicker({ textbookId, currentDate, onDateChange }: ExamDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentDate || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!date) return;
    setSaving(true);
    try {
      await fetchWithToast('/api/naesin/exam-date', {
        body: { textbookId, examDate: date },
        successMessage: '시험일이 설정되었습니다',
        errorMessage: '시험일 설정 중 오류가 발생했습니다',
        logContext: 'naesin.exam_date_picker',
      });
      onDateChange(date);
      setOpen(false);
    } catch {
      // error already toasted by fetchWithToast
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          {currentDate ? '시험일 변경' : '시험일 설정'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>시험일 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="exam-date">시험 날짜</Label>
            <Input
              id="exam-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={!date || saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
