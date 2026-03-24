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
import { FileText, Upload, Loader2, Check, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { BlankItem } from '@/types/textbook';
import { logger } from '@/lib/logger';

type DifficultyKey = 'easy' | 'medium' | 'hard';

const AUTO_INTERVAL: Record<DifficultyKey, number> = { easy: 5, medium: 3, hard: 2 };
const DIFFICULTY_LABEL: Record<DifficultyKey, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function generateAutoBlanks(originalText: string, difficulty: DifficultyKey): BlankItem[] {
  const words = originalText.trim().split(/\s+/);
  const interval = AUTO_INTERVAL[difficulty];
  return words
    .map((w, i) => ({ index: i, answer: w }))
    .filter((_, i) => i % interval === interval - 1);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BlankConfigurator({
  difficulty,
  originalText,
  blanks,
  onUpdate,
}: {
  difficulty: DifficultyKey;
  originalText: string;
  blanks: BlankItem[] | null;
  onUpdate: (blanks: BlankItem[] | null) => void;
}) {
  const [extracting, setExtracting] = useState(false);
  const label = DIFFICULTY_LABEL[difficulty];

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!originalText.trim()) {
      toast.error('영어 원문을 먼저 입력해주세요.');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('original_text', originalText);

      const res = await fetch('/api/naesin/passages/extract-blanks', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '추출 실패');
      }
      const data = await res.json();
      onUpdate(data.blanks);
      toast.success(`${label}: ${data.blanks.length}개 빈칸 추출됨`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF 추출 실패');
    } finally {
      setExtracting(false);
    }
  }

  function handleAutoGenerate() {
    if (!originalText.trim()) {
      toast.error('영어 원문을 먼저 입력해주세요.');
      return;
    }
    const generated = generateAutoBlanks(originalText, difficulty);
    onUpdate(generated);
    toast.success(`${label}: ${generated.length}개 빈칸 자동 생성됨`);
  }

  const hasOriginal = originalText.trim().length > 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="min-w-[52px] text-xs font-medium">{label}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={!hasOriginal}
        onClick={handleAutoGenerate}
      >
        <Wand2 className="h-3 w-3 mr-1" />자동
      </Button>
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        id={`pdf-${difficulty}`}
        onChange={handlePdfUpload}
        disabled={extracting || !hasOriginal}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={extracting || !hasOriginal}
        onClick={() => document.getElementById(`pdf-${difficulty}`)?.click()}
      >
        {extracting ? (
          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />추출 중...</>
        ) : (
          <><Upload className="h-3 w-3 mr-1" />PDF</>
        )}
      </Button>
      {blanks ? (
        <span className="text-xs text-green-600 flex items-center gap-0.5 whitespace-nowrap">
          <Check className="h-3 w-3" />{blanks.length}개
          <button type="button" className="ml-0.5 text-muted-foreground hover:text-destructive" onClick={() => onUpdate(null)}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">미설정</span>
      )}
    </div>
  );
}

function splitSentences(text: string, punctuationRe: RegExp): string[] {
  // 1) 줄바꿈으로 먼저 분리 (리스트형 텍스트 대응)
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  // 2) 각 줄 안에서 마침표/물음표/느낌표 뒤 공백으로 추가 분리
  return lines.flatMap((line) =>
    line.split(punctuationRe).map((s) => s.trim()).filter(Boolean)
  );
}

function splitIntoSentencePairs(originalText: string, koreanTranslation: string) {
  const enSentences = splitSentences(originalText, /(?<=[.!?])\s+/);
  const koSentences = splitSentences(koreanTranslation, /(?<=[.!?。])\s+/);
  const maxLen = Math.max(enSentences.length, koSentences.length, 1);
  return Array.from({ length: maxLen }, (_, i) => ({
    original: enSentences[i]?.trim() || '',
    korean: koSentences[i]?.trim() || '',
  }));
}

export function AddPassageDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sentences, setSentences] = useState<{ original: string; korean: string }[]>([{ original: '', korean: '' }]);
  const [saving, setSaving] = useState(false);
  const [extractingText, setExtractingText] = useState(false);

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
      const res = await fetch('/api/naesin/passages/extract-text', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '추출 실패');
      }
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.original_text && data.korean_translation) {
        setSentences(splitIntoSentencePairs(data.original_text, data.korean_translation));
      }
      toast.success('본문이 추출되었습니다. 문장별로 확인/수정해주세요.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF 추출 실패');
    } finally {
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

      const res = await fetch('/api/naesin/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          title,
          original_text: originalText,
          korean_translation: koreanTranslation,
          blanks_easy: makeBlanks(5),
          blanks_medium: makeBlanks(3),
          blanks_hard: makeBlanks(2),
          sentences: builtSentences,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      const passageData = await res.json();
      toast.success('지문이 추가되었습니다');

      try {
        toast.info('어법/어휘 문제 생성 중...');
        const gvRes = await fetch('/api/naesin/passages/extract-grammar-vocab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentences: builtSentences }),
        });
        if (gvRes.ok) {
          const gvData = await gvRes.json();
          if (gvData.items && gvData.items.length > 0) {
            await fetch('/api/naesin/passages', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: passageData.id, grammar_vocab_items: gvData.items }),
            });
            toast.success(`어법/어휘 문제 ${gvData.items.length}개 생성됨`);
          }
        }
      } catch (gvErr) {
        logger.error('admin.add_passage.grammar_vocab', { error: gvErr instanceof Error ? gvErr.message : String(gvErr) });
        toast.warning('어법/어휘 문제 생성 실패 (나중에 수동 생성 가능)');
      }

      onAdd();
      setOpen(false);
      setTitle('');
      setSentences([{ original: '', korean: '' }]);
    } catch (err) {
      logger.error('admin.add_passage', { error: err instanceof Error ? err.message : String(err) });
      toast.error('지문 추가 실패');
    } finally {
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

          <p className="text-xs text-muted-foreground">빈칸은 저장 시 자동 생성됩니다.</p>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
