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
import { parseAnswerLines } from '@/lib/naesin/parse-answer-lines';

export function AddProblemDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.add_problem',
    successMessage: '문제풀이 시트가 추가되었습니다',
    errorMessage: '문제풀이 시트 추가 실패',
  });
  const [title, setTitle] = useState('');
  const mode = 'image_answer' as const;
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const answerKey = parseAnswerLines(answerKeyText);
    if (answerKey.length !== Number(totalQuestions)) {
      toast.error(`정답 수(${answerKey.length})와 문항 수(${totalQuestions})가 일치하지 않습니다`, {
        description: '서술형 소문항 (1)(2)는 자동으로 합쳐집니다',
      });
      return;
    }
    await handleSubmit(async () => {
      await fetchWithToast('/api/naesin/problems', {
        body: { unitId, title, mode, answerKey, category: 'problem', pdfUrl: pdfUrl || null },
        silent: true,
      });
    }, () => { setTitle(''); setTotalQuestions(''); setAnswerKeyText(''); setPdfUrl(''); });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardList className="h-3.5 w-3.5 mr-1" />
          문제풀이 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>문제풀이 시트 추가</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="problem-title">제목</Label>
            <Input id="problem-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1과 문제풀이" required />
          </div>
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            OMR 이미지 모드로 생성됩니다. 직접 입력 문제는 템플릿에서 가져오기를 이용하세요.
          </p>
          <div>
            <Label htmlFor="problem-total">총 문항 수</Label>
            <Input id="problem-total" type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} placeholder="25" required />
          </div>
          <div>
            <Label htmlFor="problem-answers">정답 (한 줄에 하나씩)</Label>
            <Textarea
              id="problem-answers"
              value={answerKeyText}
              onChange={(e) => setAnswerKeyText(e.target.value)}
              placeholder={"3\n1\n5\n1, 3\n(a) I go (b) They come"}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              줄바꿈으로 문항 구분 · 복수 정답: 1, 3 · 서술형 (1)(2) 소문항은 줄 나눠도 자동 합침
            </p>
          </div>
          <div>
            <Label htmlFor="problem-pdf">PDF URL (선택)</Label>
            <Input id="problem-pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
