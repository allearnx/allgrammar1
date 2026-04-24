'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export function AddOmrDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.add_omr',
    successMessage: 'OMR 시트가 추가되었습니다',
    errorMessage: 'OMR 시트 추가 실패',
  });
  const [title, setTitle] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const answerKey = answerKeyText.split(',').map((s) => Number(s.trim()));
    if (answerKey.length !== Number(totalQuestions)) {
      toast.error('정답 개수와 문항 수가 일치하지 않습니다');
      return;
    }
    await handleSubmit(async () => {
      await fetchWithToast('/api/naesin/omr-sheets', {
        body: { unit_id: unitId, title, total_questions: Number(totalQuestions), answer_key: answerKey },
        silent: true,
      });
    }, () => { setTitle(''); setTotalQuestions(''); setAnswerKeyText(''); });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardList className="h-3.5 w-3.5 mr-1" />
          OMR 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>OMR 시트 추가</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="omr-title">제목</Label>
            <Input id="omr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1차 내신 대비" required />
          </div>
          <div>
            <Label htmlFor="omr-total">총 문항 수</Label>
            <Input id="omr-total" type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} placeholder="25" required />
          </div>
          <div>
            <Label htmlFor="omr-answers">정답 (쉼표 구분, 1~5)</Label>
            <Textarea
              id="omr-answers"
              value={answerKeyText}
              onChange={(e) => setAnswerKeyText(e.target.value)}
              placeholder="3, 1, 5, 2, 4, 1, 3, ..."
              rows={3}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
