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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileQuestion, Loader2, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { parseParentheticalAnswer } from '@/lib/naesin/parse-parenthetical-answer';
import { parseAnswerLines } from '@/lib/naesin/parse-answer-lines';

interface ExtractedQuestion {
  number: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export function AddMockExamDialog({ unitId, textbookId, onAdd }: { unitId?: string; textbookId?: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.add_mock_exam',
    successMessage: '예상문제 시트가 추가되었습니다',
    errorMessage: '예상문제 시트 추가 실패',
  });
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'interactive' | 'image_answer'>('image_answer');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  // PDF 추출 관련 state
  const [step, setStep] = useState<'form' | 'loading' | 'preview'>('form');
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetAll() {
    setTitle('');
    setTotalQuestions('');
    setAnswerKeyText('');
    setPdfUrl('');
    setStep('form');
    setExtractedQuestions([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // 기존 수동 폼 제출
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const answerKey = parseAnswerLines(answerKeyText);
    if (answerKey.length !== Number(totalQuestions)) {
      toast.error(`정답 수(${answerKey.length})와 문항 수(${totalQuestions})가 일치하지 않습니다`, {
        description: '서술형 소문항 (1)(2)는 자동으로 합쳐집니다',
      });
      return;
    }
    await handleSubmit(async () => {
      await fetchWithToast('/api/naesin/problems', {
        body: { unitId: unitId || undefined, textbookId: textbookId || undefined, title, mode, answerKey, category: 'mock_exam', pdfUrl: pdfUrl || null },
        silent: true,
      });
    }, resetAll);
  }

  // PDF/이미지 파일 선택 → 업로드 + AI 추출 (다중 파일 지원)
  async function handleFileExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    let totalSize = 0;
    let hasPdf = false;
    for (const f of Array.from(selectedFiles)) {
      const isPdf = f.type === 'application/pdf';
      const isImage = f.type.startsWith('image/');
      if (!isPdf && !isImage) {
        toast.error('PDF 또는 이미지 파일만 업로드 가능합니다');
        return;
      }
      if (isPdf) hasPdf = true;
      totalSize += f.size;
    }
    if (totalSize > 20 * 1024 * 1024) {
      toast.error('전체 파일 크기는 20MB 이하만 가능합니다');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setStep('loading');

    try {
      // 1) PDF인 경우 첫 번째 PDF를 Supabase Storage에 업로드
      if (hasPdf) {
        const pdfFile = Array.from(selectedFiles).find((f) => f.type === 'application/pdf')!;
        const uploadForm = new FormData();
        uploadForm.append('file', pdfFile);
        const { url } = await fetchWithToast<{ url: string }>('/api/naesin/passages/upload-pdf', {
          body: uploadForm,
          errorMessage: 'PDF 업로드 실패',
        });
        setPdfUrl(url);
      }

      // 2) AI 추출 (모든 파일을 한 번에 전송)
      const extractForm = new FormData();
      for (const f of Array.from(selectedFiles)) {
        extractForm.append('file', f);
      }
      const { questions } = await fetchWithToast<{ questions: ExtractedQuestion[] }>(
        '/api/naesin/problems/extract-pdf',
        { body: extractForm, errorMessage: 'AI 문제 추출 실패' },
      );

      setExtractedQuestions(questions);
      if (!title) setTitle(hasPdf ? 'PDF 추출 예상문제' : '이미지 추출 예상문제');
      setMode('interactive');
      setStep('preview');
    } catch {
      setStep('form');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // preview에서 저장
  async function handleSaveExtracted() {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    const questions = extractedQuestions.map((q, i) => {
      const base: Record<string, unknown> = {
        number: i + 1,
        question: q.question,
        ...(q.options?.length ? { options: q.options } : {}),
        answer: q.answer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      };
      // 서술형만 괄호 대안 분리
      if (!q.options?.length) {
        const parsed = parseParentheticalAnswer(q.answer);
        if (parsed) {
          base.answer = parsed.main;
          base.acceptedAnswers = parsed.alternatives;
        }
      }
      return base;
    });
    const answerKey = questions.map((q) => q.answer);

    await handleSubmit(async () => {
      await fetchWithToast('/api/naesin/problems', {
        body: { unitId: unitId || undefined, textbookId: textbookId || undefined, title, mode, questions, answerKey, category: 'mock_exam', pdfUrl: pdfUrl || null },
        silent: true,
      });
    }, resetAll);
  }

  function updateQuestion(index: number, field: 'question' | 'answer', value: string) {
    setExtractedQuestions((prev) => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  }

  function deleteQuestion(index: number) {
    setExtractedQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  const mcqCount = extractedQuestions.filter((q) => q.options?.length > 0).length;
  const subjectiveCount = extractedQuestions.length - mcqCount;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetAll(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileQuestion className="h-3.5 w-3.5 mr-1" />
          예상문제 추가
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${step === 'preview' ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <DialogHeader><DialogTitle>예상문제 시트 추가</DialogTitle></DialogHeader>

        {/* --- loading 스텝 --- */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">AI가 문제를 추출하고 있습니다... (최대 2분)</p>
          </div>
        )}

        {/* --- preview 스텝 --- */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="preview-title">제목</Label>
                <Input id="preview-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예상문제 제목" required />
              </div>
              <div className="w-32">
                <Label>풀이 방식</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as 'interactive' | 'image_answer')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interactive">직접 입력</SelectItem>
                    <SelectItem value="image_answer">OMR 이미지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">총 {extractedQuestions.length}문제</Badge>
              {mcqCount > 0 && <Badge variant="outline">객관식 {mcqCount}</Badge>}
              {subjectiveCount > 0 && <Badge variant="outline">서술형 {subjectiveCount}</Badge>}
            </div>

            <div className="border rounded-md max-h-[55vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-left w-8">#</th>
                    <th className="px-2 py-1.5 text-left">문제</th>
                    <th className="px-2 py-1.5 text-left w-28">정답</th>
                    <th className="px-2 py-1.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {extractedQuestions.map((q, i) => (
                    <tr key={i} className="border-t align-top">
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-1 py-1">
                        <Textarea
                          value={q.question}
                          onChange={(e) => updateQuestion(i, 'question', e.target.value)}
                          className="min-h-[2rem] text-xs resize-none"
                          rows={1}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          value={q.answer}
                          onChange={(e) => updateQuestion(i, 'answer', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteQuestion(i)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveExtracted} className="flex-1" disabled={saving || extractedQuestions.length === 0}>
                {saving ? '저장 중...' : '저장'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep('form'); setExtractedQuestions([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                다시
              </Button>
            </div>
          </div>
        )}

        {/* --- form 스텝 (기존 + PDF 업로드) --- */}
        {step === 'form' && (
          <>
            {/* PDF/이미지 자동 추출 섹션 */}
            <div className="border-2 border-dashed rounded-lg p-4 text-center space-y-2">
              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">AI 자동 추출</p>
              <p className="text-xs text-muted-foreground">시험 PDF 또는 스크린샷을 업로드하면 AI가 문제와 정답을 자동으로 추출합니다 (20MB 이하)</p>
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
              <span className="px-2 text-xs text-muted-foreground">또는 직접 입력</span>
              <div className="flex-1 border-t" />
            </div>

            {/* 기존 수동 입력 폼 */}
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <Label htmlFor="mock-title">제목</Label>
                <Input id="mock-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1과 예상문제" required />
              </div>
              <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                OMR 이미지 모드로 생성됩니다. 직접 입력 문제는 위의 PDF 추출을 이용하세요.
              </p>
              <div>
                <Label htmlFor="mock-total">총 문항 수</Label>
                <Input id="mock-total" type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} placeholder="25" required />
              </div>
              <div>
                <Label htmlFor="mock-answers">정답 (한 줄에 하나씩)</Label>
                <Textarea
                  id="mock-answers"
                  value={answerKeyText}
                  onChange={(e) => setAnswerKeyText(e.target.value)}
                  placeholder={"3\n1\n5\n1, 3\n(a) I go (b) They come"}
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  줄바꿈으로 문항 구분 · 복수 정답: 1, 3 · 서술형 (1)(2) 소문항은 줄 나눠도 자동 합침
                </p>
              </div>
              <div>
                <Label htmlFor="mock-pdf">PDF URL (선택)</Label>
                <Input id="mock-pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? '저장 중...' : '추가'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
