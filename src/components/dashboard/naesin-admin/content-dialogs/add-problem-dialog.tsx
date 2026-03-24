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
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function AddProblemDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'interactive' | 'image_answer'>('interactive');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const answerKey = answerKeyText.split(',').map((s) => s.trim()).filter(Boolean);
      if (answerKey.length !== Number(totalQuestions)) {
        toast.error('정답 개수와 문항 수가 일치하지 않습니다');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/naesin/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          title,
          mode,
          answerKey,
          category: 'problem',
          pdfUrl: pdfUrl || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      onAdd();
      setOpen(false);
      setTitle('');
      setTotalQuestions('');
      setAnswerKeyText('');
      setPdfUrl('');
      toast.success('문제풀이 시트가 추가되었습니다');
    } catch (err) {
      logger.error('admin.add_problem', { error: err instanceof Error ? err.message : String(err) });
      toast.error('문제풀이 시트 추가 실패');
    } finally {
      setSaving(false);
    }
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="problem-title">제목</Label>
            <Input id="problem-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1과 문제풀이" required />
          </div>
          <div>
            <Label htmlFor="problem-mode">풀이 방식</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'interactive' | 'image_answer')}>
              <SelectTrigger id="problem-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interactive">직접 입력</SelectItem>
                <SelectItem value="image_answer">OMR 이미지</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="problem-total">총 문항 수</Label>
            <Input id="problem-total" type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} placeholder="25" required />
          </div>
          <div>
            <Label htmlFor="problem-answers">정답 (쉼표 구분)</Label>
            <Textarea
              id="problem-answers"
              value={answerKeyText}
              onChange={(e) => setAnswerKeyText(e.target.value)}
              placeholder="3, 1, 5, 2, 4, 1, 3, ..."
              rows={3}
              required
            />
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
