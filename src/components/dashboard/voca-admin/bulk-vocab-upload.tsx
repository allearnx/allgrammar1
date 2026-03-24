'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function BulkVocabUpload({ dayId, onAdd }: { dayId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = text.trim().split('\n').filter((l) => l.trim());
    if (lines.length === 0) return;

    const items = lines.map((line) => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
      return {
        front_text: (parts[0] || '').trim(),
        back_text: (parts[1] || '').trim(),
        part_of_speech: (parts[2] || '').trim() || null,
        example_sentence: (parts[3] || '').trim() || null,
        synonyms: (parts[4] || '').trim() || null,
        antonyms: (parts[5] || '').trim() || null,
        spelling_hint: (parts[6] || '').trim() || null,
        spelling_answer: (parts[7] || '').trim() || null,
      };
    }).filter((i) => i.front_text && i.back_text);

    if (items.length === 0) { toast.error('유효한 단어가 없습니다'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/voca/vocabulary/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_id: dayId, items }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd();
      setOpen(false);
      setText('');
      toast.success(`${data.count}개 단어가 추가되었습니다`);
    } catch (err) {
      logger.error('voca_admin.bulk_vocab', { error: err instanceof Error ? err.message : String(err) });
      toast.error('대량 업로드 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Upload className="h-4 w-4 mr-1" />대량 업로드</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>단어 대량 업로드</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>탭/쉼표 구분 (영어, 한국어, 품사, 예문, 유의어, 반의어, 힌트, 정답)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={`big\t큰\tadj.\tThe house is big.\tlarge\tsmall\n`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            줄바꿈으로 구분. 최소 영어, 한국어 2열 필수.
          </p>
          <Button type="submit" className="w-full" disabled={saving || !text.trim()}>
            {saving ? '업로드 중...' : '업로드'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
