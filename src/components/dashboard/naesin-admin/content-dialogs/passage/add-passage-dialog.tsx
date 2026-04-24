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
import { FileText, Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { splitIntoSentencePairs } from '@/lib/naesin/sentence-utils';

export function AddPassageDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sentences, setSentences] = useState<{ original: string; korean: string }[]>([{ original: '', korean: '' }]);
  const [saving, setSaving] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [pdfUrl] = useState('');

  function updateSentence(idx: number, field: 'original' | 'korean', value: string) {
    setSentences((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addSentence() {
    setSentences((prev) => [...prev, { original: '', korean: '' }]);
  }

  function removeSentence(idx: number) {
    if (sentences.length <= 1) return;
    setSentences((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleTextPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractingText(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await fetchWithToast<{ title?: string; sentences?: { original: string; korean: string }[]; original_text?: string; korean_translation?: string }>(
        '/api/naesin/passages/extract-text',
        { body: formData, successMessage: '본문이 추출되었습니다. 문장별로 확인/수정해주세요.', errorMessage: 'PDF 추출 실패' },
      );
      if (data.title) setTitle(data.title);
      if (data.sentences && data.sentences.length > 0) {
        setSentences(data.sentences.map((s) => ({
          original: s.original?.trim() || '',
          korean: s.korean?.trim() || '',
        })));
      } else if (data.original_text && data.korean_translation) {
        setSentences(splitIntoSentencePairs(data.original_text, data.korean_translation));
      }
    } catch { /* fetchWithToast handles toasts */ } finally {
      setExtractingText(false);
    }
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
        words: s.original.trim().split(/\s+/).filter(Boolean),
      }));
      const originalText = builtSentences.map((s) => s.original).join(' ');
      const koreanTranslation = builtSentences.map((s) => s.korean).join(' ');

      const words = originalText.split(/\s+/);
      const makeBlanks = (interval: number) =>
        words.map((w, i) => ({ index: i, answer: w })).filter((_, i) => i % interval === interval - 1);

      const passageData = await fetchWithToast<{ id: string }>('/api/naesin/passages', {
        body: {
          unit_id: unitId,
          title,
          original_text: originalText,
          korean_translation: koreanTranslation,
          blanks_easy: makeBlanks(5),
          blanks_medium: makeBlanks(3),
          blanks_hard: makeBlanks(2),
          sentences: builtSentences,
          pdf_url: pdfUrl || null,
        },
        successMessage: '지문이 추가되었습니다',
        errorMessage: '지문 추가 실패',
        logContext: 'admin.add_passage',
      });

      // Close dialog immediately — grammar/vocab generation runs in background
      onAdd();
      setOpen(false);
      setTitle('');
      setSentences([{ original: '', korean: '' }]);

      // Fire-and-forget: grammar/vocab generation (user doesn't need to wait)
      toast.info('어법/어휘 문제 백그라운드 생성 중...');
      fetch('/api/naesin/passages/extract-grammar-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences: builtSentences }),
      })
        .then(async (gvRes) => {
          if (!gvRes.ok) throw new Error('API error');
          const gvData = await gvRes.json();
          if (gvData.items && gvData.items.length > 0) {
            await fetch('/api/naesin/passages', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: passageData.id, grammar_vocab_items: gvData.items }),
            });
            toast.success(`어법/어휘 문제 ${gvData.items.length}개 생성됨`);
            onAdd(); // Refresh list to show updated data
          }
        })
        .catch((gvErr) => {
          logger.error('admin.add_passage.grammar_vocab', { error: gvErr instanceof Error ? gvErr.message : String(gvErr) });
          toast.warning('어법/어휘 문제 생성 실패 (나중에 수동 생성 가능)');
        });
    } catch { /* fetchWithToast handles toasts/logging */ } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-3.5 w-3.5 mr-1" />
          지문 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>교과서 지문 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-md border border-dashed p-3 text-center">
            <input type="file" accept=".pdf" className="hidden" id="pdf-text-extract" onChange={handleTextPdfUpload} disabled={extractingText} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={extractingText}
              onClick={() => document.getElementById('pdf-text-extract')?.click()}
            >
              {extractingText ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />본문 추출 중...</>
              ) : (
                <><Upload className="h-4 w-4 mr-1.5" />PDF에서 본문 추출</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">또는 아래에 직접 입력</p>
          </div>

          <div>
            <Label htmlFor="passage-title">제목</Label>
            <Input id="passage-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="본문 1" required />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>문장별 한/영 입력</Label>
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

          <p className="text-xs text-muted-foreground">빈칸은 저장 시 자동 생성됩니다. 학생 다운로드용 PDF는 지문 목록에서 별도 업로드하세요.</p>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
