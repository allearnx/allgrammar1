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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function AddVocabDialog({ dayId, onAdd }: { dayId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    front_text: '', back_text: '', part_of_speech: '', example_sentence: '',
    synonyms: '', antonyms: '', spelling_hint: '', spelling_answer: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.front_text.trim() || !form.back_text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/voca/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_id: dayId,
          front_text: form.front_text.trim(),
          back_text: form.back_text.trim(),
          part_of_speech: form.part_of_speech.trim() || null,
          example_sentence: form.example_sentence.trim() || null,
          synonyms: form.synonyms.trim() || null,
          antonyms: form.antonyms.trim() || null,
          spelling_hint: form.spelling_hint.trim() || null,
          spelling_answer: form.spelling_answer.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      onAdd();
      setOpen(false);
      setForm({ front_text: '', back_text: '', part_of_speech: '', example_sentence: '', synonyms: '', antonyms: '', spelling_hint: '', spelling_answer: '' });
      toast.success('단어가 추가되었습니다');
    } catch (err) {
      console.error(err);
      toast.error('단어 추가 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />단어 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>단어 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>영어 *</Label><Input value={form.front_text} onChange={(e) => setForm({ ...form, front_text: e.target.value })} /></div>
            <div><Label>한국어 *</Label><Input value={form.back_text} onChange={(e) => setForm({ ...form, back_text: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>품사</Label><Input value={form.part_of_speech} onChange={(e) => setForm({ ...form, part_of_speech: e.target.value })} /></div>
            <div className="col-span-2"><Label>예문</Label><Input value={form.example_sentence} onChange={(e) => setForm({ ...form, example_sentence: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>유의어</Label><Input value={form.synonyms} onChange={(e) => setForm({ ...form, synonyms: e.target.value })} /></div>
            <div><Label>반의어</Label><Input value={form.antonyms} onChange={(e) => setForm({ ...form, antonyms: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>스펠링 힌트</Label><Input value={form.spelling_hint} onChange={(e) => setForm({ ...form, spelling_hint: e.target.value })} /></div>
            <div><Label>스펠링 정답</Label><Input value={form.spelling_answer} onChange={(e) => setForm({ ...form, spelling_answer: e.target.value })} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={saving || !form.front_text.trim() || !form.back_text.trim()}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
