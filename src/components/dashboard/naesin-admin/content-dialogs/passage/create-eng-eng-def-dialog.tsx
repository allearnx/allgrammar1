'use client';

import { useRef, useState } from 'react';
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
import { BookA, Loader2, Sparkles, Trash2, Upload, RotateCcw } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { toast } from 'sonner';
import type { NaesinProblemQuestion } from '@/types/naesin';

interface WordEntry {
  english: string;
  korean: string;
}

type Step = 'input' | 'loading' | 'preview';

export function CreateEngEngDefDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.create_eng_eng_def',
    successMessage: '영영풀이 시트가 추가되었습니다',
    errorMessage: '영영풀이 시트 추가 실패',
  });

  const [step, setStep] = useState<Step>('input');
  const [title, setTitle] = useState('');
  const [wordsText, setWordsText] = useState('');
  const [mcqCount, setMcqCount] = useState(10);
  const [writingCount, setWritingCount] = useState(5);
  const [contextCount, setContextCount] = useState(5);
  const [questions, setQuestions] = useState<NaesinProblemQuestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseWords(): WordEntry[] {
    return wordsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Support formats: "word - meaning" or "word | meaning" or "word\tmeaning"
        const parts = line.split(/\s*[-|]\s*|\t/);
        return {
          english: parts[0]?.trim() || '',
          korean: parts.slice(1).join(' ').trim() || '',
        };
      })
      .filter((w) => w.english && w.korean);
  }

  // 단어 입력 → AI 생성
  async function handleGenerate() {
    const words = parseWords();
    if (words.length === 0) return;

    setStep('loading');
    try {
      const data = await fetchWithToast<{ questions: NaesinProblemQuestion[]; title: string }>(
        '/api/naesin/problems/generate-eng-eng-def',
        {
          body: { title, words, mcqCount, writingCount, contextCount },
          silent: true,
        },
      );
      setQuestions(data.questions);
      setStep('preview');
    } catch {
      setStep('input');
    }
  }

  // PDF/이미지 업로드 → AI 추출 (다중 파일: 각각 전송 후 합침)
  async function handleFileExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (const f of Array.from(selectedFiles)) {
      const isPdf = f.type === 'application/pdf';
      const isImage = f.type.startsWith('image/');
      if (!isPdf && !isImage) {
        toast.error('PDF 또는 이미지 파일만 업로드 가능합니다');
        return;
      }
    }
    setStep('loading');

    try {
      // 각 파일을 개별 전송 → 결과 합침
      const results = await Promise.all(
        Array.from(selectedFiles).map(async (f) => {
          const form = new FormData();
          form.append('file', f);
          form.append('extractType', 'eng_eng_def');
          const { questions } = await fetchWithToast<{ questions: NaesinProblemQuestion[] }>(
            '/api/naesin/problems/extract-pdf',
            { body: form, silent: true },
          );
          return questions;
        }),
      );
      const extracted = results.flat();

      if (extracted.length === 0) {
        toast.error('문제를 추출하지 못했습니다. 파일을 확인해주세요.');
        setStep('input');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setQuestions(extracted.map((q, i) => ({ ...q, number: i + 1 })));
      if (!title) setTitle('영영풀이 (파일 추출)');
      setStep('preview');
    } catch {
      setStep('input');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    const answerKey = questions.map((q) => q.answer);

    await handleSubmit(async () => {
      await fetchWithToast('/api/naesin/problems', {
        body: {
          unitId,
          title,
          mode: 'interactive',
          questions,
          answerKey,
          category: 'eng_eng_def',
        },
        silent: true,
      });
    }, resetForm);
  }

  function resetForm() {
    setStep('input');
    setTitle('');
    setWordsText('');
    setMcqCount(10);
    setWritingCount(5);
    setContextCount(5);
    setQuestions([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemoveQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 })));
  }

  const words = parseWords();
  const previewMcq = questions.filter((q) => q.options && q.options.length > 0).length;
  const previewSubjective = questions.length - previewMcq;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BookA className="h-3.5 w-3.5 mr-1" />
          영영풀이 추가
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-h-[85vh] overflow-y-auto ${step === 'preview' ? 'max-w-2xl' : 'max-w-lg'}`}>
        <DialogHeader><DialogTitle>영영풀이 시트 생성</DialogTitle></DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            {/* PDF/이미지 자동 추출 */}
            <div className="border-2 border-dashed rounded-lg p-4 text-center space-y-2">
              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">파일에서 자동 추출</p>
              <p className="text-xs text-muted-foreground">영영풀이 시험지 PDF/스크린샷을 올리면 AI가 문제를 자동 추출합니다</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                multiple
                onChange={handleFileExtract}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                파일 선택 (PDF / 이미지)
              </Button>
            </div>

            <div className="relative flex items-center py-1">
              <div className="flex-1 border-t" />
              <span className="px-2 text-xs text-muted-foreground">또는 단어로 생성</span>
              <div className="flex-1 border-t" />
            </div>

            {/* 기존 단어 입력 생성 */}
            <p className="text-sm text-muted-foreground">
              단어 목록을 입력하면 AI가 영영 풀이 문제를 자동 생성합니다.
            </p>

            <div>
              <Label htmlFor="eed-title">시트 제목</Label>
              <Input
                id="eed-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Unit 1 영영풀이"
              />
            </div>

            <div>
              <Label htmlFor="eed-words">단어 목록 (한 줄에 하나, 영어 - 한국어)</Label>
              <Textarea
                id="eed-words"
                value={wordsText}
                onChange={(e) => setWordsText(e.target.value)}
                placeholder={"improve - 개선하다\nachieve - 성취하다\nperformance - 공연, 성과"}
                rows={8}
              />
              {words.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  인식된 단어: {words.length}개
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="eed-mcq">객관식</Label>
                <Input
                  id="eed-mcq"
                  type="number"
                  min={0}
                  max={50}
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="eed-writing">서술형</Label>
                <Input
                  id="eed-writing"
                  type="number"
                  min={0}
                  max={30}
                  value={writingCount}
                  onChange={(e) => setWritingCount(Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="eed-context">문맥 빈칸</Label>
                <Input
                  id="eed-context"
                  type="number"
                  min={0}
                  max={30}
                  value={contextCount}
                  onChange={(e) => setContextCount(Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                총 {mcqCount + writingCount + contextCount}문제
              </p>
              <p>객관식 {mcqCount} / 서술형 {writingCount} / 문맥 빈칸 {contextCount}</p>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!title.trim() || words.length === 0 || (mcqCount + writingCount + contextCount) === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI 영영풀이 생성
            </Button>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">AI가 영영 풀이 문제를 처리하고 있습니다...</p>
            <p className="text-xs text-muted-foreground">최대 2분 소요</p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="preview-eed-title">제목</Label>
              <Input id="preview-eed-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="영영풀이 제목" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">총 {questions.length}문제</Badge>
              {previewMcq > 0 && <Badge variant="outline">객관식 {previewMcq}</Badge>}
              {previewSubjective > 0 && <Badge variant="outline">서술형 {previewSubjective}</Badge>}
            </div>

            <div className="rounded-lg border overflow-hidden max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 w-10">#</th>
                    <th className="text-left p-2">문제</th>
                    <th className="text-left p-2 w-16">유형</th>
                    <th className="text-left p-2 w-20">정답</th>
                    <th className="text-left p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 text-muted-foreground">{q.number}</td>
                      <td className="p-2 whitespace-pre-line text-xs">{q.question}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {q.options && q.options.length > 0 ? '객관식' : '서술형'}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs font-mono">{String(q.answer)}</td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                          onClick={() => handleRemoveQuestion(i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving || questions.length === 0}>
                {saving ? '저장 중...' : `${questions.length}문제 영영풀이 시트 저장`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep('input'); setQuestions([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                다시
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
