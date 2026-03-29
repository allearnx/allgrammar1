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
import { MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface Sentence {
  original: string;
  korean: string;
  speaker: string;
}

export function AddDialogueDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sentences, setSentences] = useState<Sentence[]>([{ original: '', korean: '', speaker: '' }]);
  const [saving, setSaving] = useState(false);

  function updateSentence(idx: number, field: keyof Sentence, value: string) {
    setSentences((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addSentence() {
    setSentences((prev) => [...prev, { original: '', korean: '', speaker: '' }]);
  }

  function removeSentence(idx: number) {
    if (sentences.length <= 1) return;
    setSentences((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validSentences = sentences.filter((s) => s.original.trim() || s.korean.trim());
    if (validSentences.length === 0) {
      toast.error('최소 1개 문장을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const builtSentences = validSentences.map((s) => ({
        original: s.original.trim(),
        korean: s.korean.trim(),
        ...(s.speaker.trim() ? { speaker: s.speaker.trim() } : {}),
      }));

      const res = await fetch('/api/naesin/dialogues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          title: title || '대화문',
          sentences: builtSentences,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      toast.success('대화문이 추가되었습니다');
      onAdd();
      setOpen(false);
      setTitle('');
      setSentences([{ original: '', korean: '', speaker: '' }]);
    } catch (err) {
      logger.error('admin.add_dialogue', { error: err instanceof Error ? err.message : String(err) });
      toast.error('대화문 추가 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          대화문 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>대화문 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="dialogue-title">제목</Label>
            <Input id="dialogue-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="대화문 1" required />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>문장별 입력</Label>
              <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={addSentence}>
                + 문장 추가
              </Button>
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {sentences.map((s, idx) => (
                <div key={idx} className="rounded-lg border p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">{idx + 1}번 문장</span>
                    {sentences.length > 1 && (
                      <button type="button" onClick={() => removeSentence(idx)} className="text-xs text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    className="text-sm h-8"
                    value={s.speaker}
                    onChange={(e) => updateSentence(idx, 'speaker', e.target.value)}
                    placeholder="화자 (선택, 예: A, B, Mike)"
                  />
                  <Textarea
                    className="text-sm min-h-[2rem] resize-none"
                    rows={1}
                    value={s.korean}
                    onChange={(e) => updateSentence(idx, 'korean', e.target.value)}
                    placeholder="한국어"
                  />
                  <Textarea
                    className="text-sm min-h-[2rem] resize-none"
                    rows={1}
                    value={s.original}
                    onChange={(e) => updateSentence(idx, 'original', e.target.value)}
                    placeholder="English"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
