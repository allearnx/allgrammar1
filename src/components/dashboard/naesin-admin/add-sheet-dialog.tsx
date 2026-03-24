'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinWorkbookOmrSheet } from '@/types/naesin';
import { logger } from '@/lib/logger';

export function AddSheetDialog({ workbookId, onAdd }: { workbookId: string; onAdd: (sheet: NaesinWorkbookOmrSheet) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyStr, setAnswerKeyStr] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) { toast.error('시트 제목을 입력해주세요'); return; }

    const total = Number(totalQuestions);
    if (!total || total < 1) { toast.error('문항 수를 입력해주세요'); return; }

    const answerKey = answerKeyStr
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !isNaN(n) && n >= 1 && n <= 5);

    if (answerKey.length !== total) {
      toast.error(`정답 수(${answerKey.length})가 문항 수(${total})와 일치하지 않습니다`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/naesin/workbook-omr-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workbook_id: workbookId,
          title: title.trim(),
          total_questions: total,
          answer_key: answerKey,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd(data);
      setOpen(false);
      setTitle('');
      setTotalQuestions('');
      setAnswerKeyStr('');
      toast.success('OMR 시트가 추가되었습니다');
    } catch (err) {
      logger.error('admin.add_sheet', { error: err instanceof Error ? err.message : String(err) });
      toast.error('시트 추가에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          시트 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>OMR 시트 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>시트 제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: Chapter 1 단원평가" />
          </div>
          <div>
            <Label>문항 수</Label>
            <Input
              type="number"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)}
              placeholder="예: 20"
              min={1}
              max={200}
            />
          </div>
          <div>
            <Label>정답 (쉼표 또는 공백으로 구분)</Label>
            <Input
              value={answerKeyStr}
              onChange={(e) => setAnswerKeyStr(e.target.value)}
              placeholder="예: 3 1 2 4 5 1 3 2 4 5 ..."
            />
            <p className="text-xs text-muted-foreground mt-1">1~5 사이 숫자를 문항 수만큼 입력</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
