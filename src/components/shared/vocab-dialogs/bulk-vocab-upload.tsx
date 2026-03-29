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
import type { VocabDialogProps } from './types';
import { getVocabConfig } from './types';

const PLACEHOLDER: Record<'naesin' | 'voca', string> = {
  naesin: `apple, 사과, n., I eat an apple., fruit\nhappy, 행복한, adj., I am happy., glad, sad\ngrape, 포도`,
  voca: `big\t큰\tadj.\tThe house is big.\tlarge\tsmall`,
};

export function BulkVocabUpload({ module, parentId, onAdd }: VocabDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const cfg = getVocabConfig(module);

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
        spelling_answer: (parts[7] || '').trim() || (parts[0] || '').trim() || null,
      };
    }).filter((i) => i.front_text && i.back_text);

    if (items.length === 0) { toast.error('유효한 단어가 없습니다'); return; }

    setSaving(true);
    try {
      const res = await fetch(`${cfg.apiBase}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [cfg.parentIdKey]: parentId, items }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      const data = await res.json();
      onAdd();
      setOpen(false);
      setText('');
      toast.success(`${data.count}개 단어가 추가되었습니다`);
    } catch (err) {
      logger.error(`${cfg.logPrefix}.bulk_vocab`, { error: err instanceof Error ? err.message : String(err) });
      toast.error('일괄 업로드 실패');
    } finally {
      setSaving(false);
    }
  }

  const label = module === 'naesin'
    ? '한 줄에 하나씩: 영어, 한국어, 품사, 예문, 유의어, 반의어'
    : '탭/쉼표 구분 (영어, 한국어, 품사, 예문, 유의어, 반의어, 힌트, 정답)';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-3.5 w-3.5 mr-1" />
          {module === 'naesin' ? '단어 일괄 추가' : '대량 업로드'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{module === 'naesin' ? '단어 일괄 추가' : '단어 대량 업로드'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>{label}</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={PLACEHOLDER[module]}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            줄바꿈으로 구분. 최소 영어, 한국어 2열 필수.
          </p>
          <Button type="submit" className="w-full" disabled={saving || !text.trim()}>
            {saving ? '업로드 중...' : module === 'naesin' ? '일괄 추가' : '업로드'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
