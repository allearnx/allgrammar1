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
import { MessageSquare, X, Upload, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface Sentence {
  original: string;
  korean: string;
  speaker: string;
}

interface ExtractedDialogue {
  title: string;
  sentences: Sentence[];
}

function toSentence(s: { original?: string; korean?: string; speaker?: string }): Sentence {
  return {
    original: s.original?.trim() || '',
    korean: s.korean?.trim() || '',
    speaker: s.speaker?.trim() || '',
  };
}

export function AddDialogueDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.add_dialogue',
    successMessage: '대화문이 추가되었습니다',
    errorMessage: '대화문 추가 실패',
  });
  const [title, setTitle] = useState('');
  const [sentences, setSentences] = useState<Sentence[]>([{ original: '', korean: '', speaker: '' }]);
  const [extractingText, setExtractingText] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedDialogue[] | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [progress, setProgress] = useState('');

  function resetForm() {
    setTitle('');
    setSentences([{ original: '', korean: '', speaker: '' }]);
    setExtracted(null);
    setExpandedIdx(null);
    setProgress('');
  }

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

  function updateExtractedTitle(di: number, value: string) {
    setExtracted((prev) => prev?.map((d, i) => (i === di ? { ...d, title: value } : d)) ?? prev);
  }

  function updateExtractedSentence(di: number, si: number, field: keyof Sentence, value: string) {
    setExtracted((prev) =>
      prev?.map((d, i) =>
        i === di
          ? { ...d, sentences: d.sentences.map((s, j) => (j === si ? { ...s, [field]: value } : s)) }
          : d,
      ) ?? prev,
    );
  }

  function removeExtracted(di: number) {
    setExtracted((prev) => {
      const next = (prev ?? []).filter((_, i) => i !== di);
      return next.length > 0 ? next : null;
    });
    setExpandedIdx(null);
  }

  async function handleTextPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setExtractingText(true);
    try {
      const { uploadForExtract } = await import('@/lib/upload-for-extract');
      const { publicUrl, storagePath } = await uploadForExtract(file);
      const data = await fetchWithToast<{
        dialogues?: { title?: string; sentences?: { original: string; korean: string; speaker?: string }[] }[];
      }>('/api/naesin/dialogues/extract-text', {
        body: { pdfUrl: publicUrl, storagePath },
        errorMessage: 'PDF 추출 실패',
        logContext: 'admin.dialogue_pdf_extract',
      });
      const dialogues = (data.dialogues ?? [])
        .map((d, i) => ({
          title: d.title?.trim() || `대화문 ${i + 1}`,
          sentences: (d.sentences ?? []).map(toSentence),
        }))
        .filter((d) => d.sentences.length > 0);

      if (dialogues.length === 0) {
        toast.error('PDF에서 대화문을 찾지 못했습니다.');
      } else if (dialogues.length === 1) {
        setTitle(dialogues[0].title);
        setSentences(dialogues[0].sentences);
        setExtracted(null);
        toast.success('대화문이 추출되었습니다. 문장별로 확인/수정해주세요.');
      } else {
        setExtracted(dialogues);
        setExpandedIdx(null);
        toast.success(`${dialogues.length}개 대화문이 추출되었습니다. 확인 후 저장해주세요.`);
      }
    } catch { /* fetchWithToast handles toasts */ } finally {
      setExtractingText(false);
    }
  }

  async function handleSaveAll() {
    if (!extracted || extracted.length === 0) return;
    const invalid = extracted.find((d) => !d.sentences.some((s) => s.original.trim() || s.korean.trim()));
    if (invalid) {
      toast.error(`"${invalid.title}"에 문장이 없습니다. 삭제하거나 문장을 입력해주세요.`);
      return;
    }
    setSavingAll(true);
    let successCount = 0;
    try {
      for (let i = 0; i < extracted.length; i++) {
        const d = extracted[i];
        setProgress(`${i + 1}/${extracted.length} 저장 중...`);
        const builtSentences = d.sentences
          .filter((s) => s.original.trim() || s.korean.trim())
          .map((s) => ({
            original: s.original.trim(),
            korean: s.korean.trim(),
            ...(s.speaker.trim() ? { speaker: s.speaker.trim() } : {}),
          }));
        await fetchWithToast('/api/naesin/dialogues', {
          body: { unit_id: unitId, title: d.title || `대화문 ${i + 1}`, sentences: builtSentences },
          errorMessage: `"${d.title}" 저장 실패`,
          logContext: 'admin.add_dialogue_multi',
        });
        successCount++;
      }
      onAdd();
      setOpen(false);
      resetForm();
      toast.success(`${successCount}개 대화문이 추가되었습니다`);
    } catch {
      if (successCount > 0) {
        toast.warning(`${successCount}/${extracted.length}개 저장 완료, 나머지 실패`);
        setExtracted((prev) => prev?.slice(successCount) ?? prev);
        setExpandedIdx(null);
        onAdd();
      }
    } finally {
      setSavingAll(false);
      setProgress('');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validSentences = sentences.filter((s) => s.original.trim() || s.korean.trim());
    if (validSentences.length === 0) {
      toast.error('최소 1개 문장을 입력해주세요.');
      return;
    }
    await handleSubmit(async () => {
      const builtSentences = validSentences.map((s) => ({
        original: s.original.trim(),
        korean: s.korean.trim(),
        ...(s.speaker.trim() ? { speaker: s.speaker.trim() } : {}),
      }));
      await fetchWithToast('/api/naesin/dialogues', {
        body: { unit_id: unitId, title: title || '대화문', sentences: builtSentences },
        silent: true,
      });
    }, resetForm);
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetForm();
  }

  function renderSentenceFields(
    s: Sentence,
    onChange: (field: keyof Sentence, value: string) => void,
  ) {
    return (
      <>
        <Input
          className="text-sm h-8"
          value={s.speaker}
          onChange={(e) => onChange('speaker', e.target.value)}
          placeholder="화자 (선택, 예: A, B, Mike)"
        />
        <Textarea
          className="text-sm min-h-[2rem] resize-none"
          rows={1}
          value={s.korean}
          onChange={(e) => onChange('korean', e.target.value)}
          placeholder="한국어"
        />
        <Textarea
          className="text-sm min-h-[2rem] resize-none"
          rows={1}
          value={s.original}
          onChange={(e) => onChange('original', e.target.value)}
          placeholder="English"
        />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          대화문 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>대화문 추가</DialogTitle></DialogHeader>

        <div className="rounded-md border border-dashed p-3 text-center">
          <input type="file" accept=".pdf" className="hidden" id="pdf-dialogue-extract" onChange={handleTextPdfUpload} disabled={extractingText} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={extractingText}
            onClick={() => document.getElementById('pdf-dialogue-extract')?.click()}
          >
            {extractingText ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />대화문 추출 중...</>
            ) : (
              <><Upload className="h-4 w-4 mr-1.5" />PDF에서 대화문 추출</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            {extracted ? 'PDF에 대화문이 여러 개면 자동으로 분리됩니다' : '또는 아래에 직접 입력'}
          </p>
        </div>

        {extracted ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {extracted.length}개 대화문이 추출되었습니다. 제목·문장을 확인한 뒤 저장하세요.
            </p>
            <div className="space-y-2 max-h-[45vh] overflow-y-auto">
              {extracted.map((d, di) => (
                <div key={di} className="rounded-lg border p-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => setExpandedIdx(expandedIdx === di ? null : di)}
                      aria-label={expandedIdx === di ? '접기' : '펼치기'}
                    >
                      {expandedIdx === di ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <Input
                      className="text-sm h-8"
                      value={d.title}
                      onChange={(e) => updateExtractedTitle(di, e.target.value)}
                      placeholder={`대화문 ${di + 1}`}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {d.sentences.length}문장
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExtracted(di)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="대화문 삭제"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {expandedIdx === di && (
                    <div className="space-y-2">
                      {d.sentences.map((s, si) => (
                        <div key={si} className="rounded-lg border p-2 space-y-1">
                          <span className="text-xs text-muted-foreground font-medium">{si + 1}번 문장</span>
                          {renderSentenceFields(s, (field, value) => updateExtractedSentence(di, si, field, value))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" className="w-full" onClick={handleSaveAll} disabled={savingAll}>
              {savingAll ? progress || '저장 중...' : `${extracted.length}개 대화문 모두 저장`}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={resetForm} disabled={savingAll}>
              추출 결과 버리고 직접 입력
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
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
                    {renderSentenceFields(s, (field, value) => updateSentence(idx, field, value))}
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? '저장 중...' : '추가'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
