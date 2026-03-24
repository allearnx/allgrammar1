'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function AddVocabDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [antonyms, setAntonyms] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          front_text: frontText,
          back_text: backText,
          part_of_speech: partOfSpeech || null,
          example_sentence: exampleSentence || null,
          synonyms: synonyms || null,
          antonyms: antonyms || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      onAdd();
      setOpen(false);
      setFrontText('');
      setBackText('');
      setPartOfSpeech('');
      setExampleSentence('');
      setSynonyms('');
      setAntonyms('');
      toast.success('단어가 추가되었습니다');
    } catch (err) {
      logger.error('admin.add_vocab', { error: err instanceof Error ? err.message : String(err) });
      toast.error('단어 추가 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BookOpen className="h-3.5 w-3.5 mr-1" />
          단어 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>단어 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="vocab-front">앞면 (영어)</Label>
            <Input id="vocab-front" value={frontText} onChange={(e) => setFrontText(e.target.value)} placeholder="apple" required />
          </div>
          <div>
            <Label htmlFor="vocab-back">뒷면 (한국어)</Label>
            <Input id="vocab-back" value={backText} onChange={(e) => setBackText(e.target.value)} placeholder="사과" required />
          </div>
          <div>
            <Label htmlFor="vocab-pos">품사 (선택)</Label>
            <Input id="vocab-pos" value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)} placeholder="n. / v. / adj. / adv." />
          </div>
          <div>
            <Label htmlFor="vocab-example">예문 (선택)</Label>
            <Input id="vocab-example" value={exampleSentence} onChange={(e) => setExampleSentence(e.target.value)} placeholder="I eat an apple every day." />
          </div>
          <div>
            <Label htmlFor="vocab-synonyms">유의어 (선택, /로 구분)</Label>
            <Input id="vocab-synonyms" value={synonyms} onChange={(e) => setSynonyms(e.target.value)} placeholder="glad / joyful" />
          </div>
          <div>
            <Label htmlFor="vocab-antonyms">반의어 (선택, /로 구분)</Label>
            <Input id="vocab-antonyms" value={antonyms} onChange={(e) => setAntonyms(e.target.value)} placeholder="sad / unhappy" />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
