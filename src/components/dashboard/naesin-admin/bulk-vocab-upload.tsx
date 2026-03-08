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

export function BulkVocabUpload({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Parse: front_text, back_text, example_sentence, synonyms, antonyms
      const lines = csvText.trim().split('\n').filter((l) => l.trim());
      const items = lines.map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          front_text: parts[0] || '',
          back_text: parts[1] || '',
          part_of_speech: parts[2] || null,
          example_sentence: parts[3] || null,
          synonyms: parts[4] || null,
          antonyms: parts[5] || null,
          spelling_answer: parts[0] || null,
        };
      });

      const res = await fetch('/api/naesin/vocabulary/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_id: unitId, items }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      const data = await res.json();
      onAdd();
      setOpen(false);
      setCsvText('');
      toast.success(`${data.count}개 단어가 추가되었습니다`);
    } catch (err) {
      console.error(err);
      toast.error('일괄 업로드 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-3.5 w-3.5 mr-1" />
          단어 일괄 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>단어 일괄 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="vocab-bulk-csv">한 줄에 하나씩: 영어, 한국어, 품사, 예문, 유의어, 반의어</Label>
            <Textarea
              id="vocab-bulk-csv"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`apple, 사과, n., I eat an apple., fruit\nhappy, 행복한, adj., I am happy., glad, sad\ngrape, 포도`}
              rows={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '업로드 중...' : '일괄 추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
