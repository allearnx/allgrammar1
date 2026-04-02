'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export function AddMockExamDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.add_mock_exam',
    successMessage: '예상문제 시트가 추가되었습니다',
    errorMessage: '예상문제 시트 추가 실패',
  });
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'interactive' | 'image_answer'>('interactive');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const answerKey = answerKeyText.split(',').map((s) => s.trim()).filter(Boolean);
    if (answerKey.length !== Number(totalQuestions)) {
      toast.error('정답 개수와 문항 수가 일치하지 않습니다');
      return;
    }
    await handleSubmit(async () => {
      await fetchWithToast('/api/naesin/problems', {
        body: { unitId, title, mode, answerKey, category: 'mock_exam', pdfUrl: pdfUrl || null },
        silent: true,
      });
    }, () => { setTitle(''); setTotalQuestions(''); setAnswerKeyText(''); setPdfUrl(''); });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileQuestion className="h-3.5 w-3.5 mr-1" />
          예상문제 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>예상문제 시트 추가</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="mock-title">제목</Label>
            <Input id="mock-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1과 예상문제" required />
          </div>
          <div>
            <Label htmlFor="mock-mode">풀이 방식</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'interactive' | 'image_answer')}>
              <SelectTrigger id="mock-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interactive">직접 입력</SelectItem>
                <SelectItem value="image_answer">OMR 이미지</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="mock-total">총 문항 수</Label>
            <Input id="mock-total" type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} placeholder="25" required />
          </div>
          <div>
            <Label htmlFor="mock-answers">정답 (쉼표 구분)</Label>
            <Textarea
              id="mock-answers"
              value={answerKeyText}
              onChange={(e) => setAnswerKeyText(e.target.value)}
              placeholder="3, 1, 5, 2, 4, 1, 3, ..."
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="mock-pdf">PDF URL (선택)</Label>
            <Input id="mock-pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
