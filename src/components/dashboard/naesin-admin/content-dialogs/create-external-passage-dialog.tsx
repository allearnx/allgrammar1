'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Loader2, Upload, Trash2, ArrowUp, ArrowDown, Pencil, Check } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { toast } from 'sonner';
import type { ExternalPassageSentence } from '@/types/naesin';

type Step = 'input' | 'extracting' | 'edit';

interface SentenceRow {
  original: string;
  korean: string;
}

export function CreateExternalPassageDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.create_external_passage',
    successMessage: '외부지문 시트가 추가되었습니다',
    errorMessage: '외부지문 시트 추가 실패',
  });

  const [step, setStep] = useState<Step>('input');
  const [title, setTitle] = useState('');
  const [manualText, setManualText] = useState('');
  const [sentences, setSentences] = useState<SentenceRow[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SentenceRow>({ original: '', korean: '' });

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('extracting');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await fetchWithToast<{
        title: string;
        sentences?: { original: string; korean: string }[];
      }>('/api/naesin/passages/extract-text', {
        body: formData,
        silent: true,
      });

      if (data.title && !title) setTitle(data.title);
      if (data.sentences && data.sentences.length > 0) {
        setSentences(data.sentences);
        setStep('edit');
      } else {
        toast.error('문장을 추출하지 못했습니다. 수동 입력을 이용해주세요.');
        setStep('input');
      }
    } catch {
      setStep('input');
    }
    // Reset file input
    e.target.value = '';
  }

  function handleManualParse() {
    const lines = manualText.split('\n').filter((l) => l.trim());
    const parsed: SentenceRow[] = [];

    for (const line of lines) {
      // Support: "English sentence | 한국어 번역" or "English sentence\t한국어 번역"
      const parts = line.split(/\s*\|\s*|\t/);
      if (parts.length >= 2) {
        parsed.push({ original: parts[0].trim(), korean: parts.slice(1).join(' ').trim() });
      }
    }

    if (parsed.length === 0) {
      toast.error('문장을 파싱할 수 없습니다. "영어 | 한국어" 형식으로 입력해주세요.');
      return;
    }

    setSentences(parsed);
    setStep('edit');
  }

  function moveSentence(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sentences.length) return;
    setSentences((prev) => {
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  function deleteSentence(idx: number) {
    setSentences((prev) => prev.filter((_, i) => i !== idx));
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditForm(sentences[idx]);
  }

  function saveEdit() {
    if (editingIdx === null) return;
    setSentences((prev) => prev.map((s, i) => (i === editingIdx ? { ...editForm } : s)));
    setEditingIdx(null);
  }

  async function handleSave() {
    if (sentences.length === 0) return;

    // Build questions in ExternalPassageSentence format
    const questions: ExternalPassageSentence[] = sentences.map((s, i) => ({
      number: i + 1,
      original: s.original,
      korean: s.korean,
      words: s.original.split(/\s+/),
      acceptedAnswers: [s.original.replace(/[.!?]$/, '').trim()],
    }));

    const answerKey = questions.map((q) => q.original);

    await handleSubmit(async () => {
      await fetchWithToast('/api/naesin/problems', {
        body: {
          unitId,
          title,
          mode: 'interactive',
          questions,
          answerKey,
          category: 'external_passage',
        },
        silent: true,
      });
    }, resetForm);
  }

  function resetForm() {
    setStep('input');
    setTitle('');
    setManualText('');
    setSentences([]);
    setEditingIdx(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-3.5 w-3.5 mr-1" />
          외부지문 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>외부지문 시트 생성</DialogTitle></DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              외부지문의 영어-한국어 문장 쌍을 입력하세요. 학생은 순서배열과 영작 연습을 합니다.
            </p>

            <div>
              <Label htmlFor="ep-title">시트 제목</Label>
              <Input
                id="ep-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson 5 외부지문"
              />
            </div>

            <div className="space-y-2">
              <Label>PDF 업로드 (자동 추출)</Label>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="ep-pdf"
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">PDF 파일 선택</span>
                </Label>
                <input
                  id="ep-pdf"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handlePdfUpload}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">또는</span></div>
            </div>

            <div>
              <Label htmlFor="ep-manual">수동 입력 (영어 | 한국어, 한 줄에 하나)</Label>
              <Textarea
                id="ep-manual"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={"She has been studying English since she was five. | 그녀는 다섯 살 때부터 영어를 공부해 오고 있다.\nHe decided to become a scientist. | 그는 과학자가 되기로 결심했다."}
                rows={8}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleManualParse}
              disabled={!title.trim() || !manualText.trim()}
            >
              문장 파싱하기
            </Button>
          </div>
        )}

        {step === 'extracting' && (
          <div className="flex flex-col items-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">PDF에서 문장을 추출하고 있습니다...</p>
            <p className="text-xs text-muted-foreground">최대 2분 소요</p>
          </div>
        )}

        {step === 'edit' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{sentences.length}문장</Badge>
              <Button size="sm" variant="ghost" onClick={() => setStep('input')}>
                처음으로
              </Button>
            </div>

            <div>
              <Label htmlFor="ep-title-edit">시트 제목</Label>
              <Input
                id="ep-title-edit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson 5 외부지문"
              />
            </div>

            <div className="rounded-lg border overflow-hidden max-h-[45vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 w-8">#</th>
                    <th className="text-left p-2">영어</th>
                    <th className="text-left p-2">한국어</th>
                    <th className="text-left p-2 w-24">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {sentences.map((s, i) => (
                    <tr key={i} className="border-t">
                      {editingIdx === i ? (
                        <>
                          <td className="p-2 text-muted-foreground">{i + 1}</td>
                          <td className="p-2">
                            <Textarea
                              value={editForm.original}
                              onChange={(e) => setEditForm((f) => ({ ...f, original: e.target.value }))}
                              rows={2}
                              className="text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <Textarea
                              value={editForm.korean}
                              onChange={(e) => setEditForm((f) => ({ ...f, korean: e.target.value }))}
                              rows={2}
                              className="text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={saveEdit}>
                              <Check className="h-3 w-3" />
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 text-muted-foreground">{i + 1}</td>
                          <td className="p-2 text-xs">{s.original}</td>
                          <td className="p-2 text-xs text-muted-foreground">{s.korean}</td>
                          <td className="p-2">
                            <div className="flex gap-0.5">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveSentence(i, -1)} disabled={i === 0}>
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveSentence(i, 1)} disabled={i === sentences.length - 1}>
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEdit(i)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => deleteSentence(i)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || sentences.length === 0 || !title.trim()}
            >
              {saving ? '저장 중...' : `${sentences.length}문장 외부지문 시트 저장`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
