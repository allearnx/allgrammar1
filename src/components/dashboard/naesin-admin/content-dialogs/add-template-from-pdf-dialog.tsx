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
} from '@/components/ui/dialog';
import { Loader2, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { parseParentheticalAnswer } from '@/lib/naesin/parse-parenthetical-answer';

interface ExtractedQuestion {
  number: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
}

export function AddTemplateFromPdfDialog({ open, onOpenChange, onAdd }: Props) {
  const { saving, handleSubmit } = useFormDialog({
    onSuccess: () => {
      onAdd();
      onOpenChange(false);
    },
    logContext: 'admin.add_template_from_pdf',
    successMessage: '템플릿이 추가되었습니다',
    errorMessage: '템플릿 추가 실패',
  });
  const [title, setTitle] = useState('');
  const [templateTopic, setTemplateTopic] = useState('');
  const [step, setStep] = useState<'form' | 'loading' | 'preview'>('form');
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetAll() {
    setTitle('');
    setTemplateTopic('');
    setStep('form');
    setExtractedQuestions([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) resetAll();
  }

  // PDF/이미지 파일 선택 → 업로드 + AI 추출
  async function handleFileExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    let hasPdf = false;
    const imageFiles: File[] = [];
    for (const f of Array.from(selectedFiles)) {
      const isPdf = f.type === 'application/pdf';
      const isImage = f.type.startsWith('image/');
      if (!isPdf && !isImage) {
        toast.error('PDF 또는 이미지 파일만 업로드 가능합니다');
        return;
      }
      if (isPdf) hasPdf = true;
      else imageFiles.push(f);
    }
    setStep('loading');

    try {
      const allQuestions: ExtractedQuestion[] = [];

      // PDF → extract-pdf (청크 병렬 처리)
      if (hasPdf) {
        const pdfFile = Array.from(selectedFiles).find((f) => f.type === 'application/pdf')!;
        const form = new FormData();
        form.append('file', pdfFile);
        const { questions } = await fetchWithToast<{ questions: ExtractedQuestion[] }>(
          '/api/naesin/problems/extract-pdf',
          { body: form, silent: true },
        );
        allQuestions.push(...questions);
      }

      // 이미지 → Storage 업로드 후 배치 추출
      if (imageFiles.length > 0) {
        const imageUrls = await Promise.all(
          imageFiles.map(async (f) => {
            const form = new FormData();
            form.append('file', f);
            const { url } = await fetchWithToast<{ url: string }>('/api/naesin/upload-image', {
              body: form,
              silent: true,
            });
            return { url, mediaType: f.type };
          }),
        );

        const { questions } = await fetchWithToast<{ questions: ExtractedQuestion[] }>(
          '/api/naesin/problems/extract-images',
          { body: { imageUrls }, silent: true },
        );
        allQuestions.push(...questions);
      }

      if (allQuestions.length === 0) {
        toast.error('문제를 추출하지 못했습니다. 파일을 확인해주세요.');
        setStep('form');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setExtractedQuestions(allQuestions);
      if (!title) setTitle(hasPdf ? 'PDF 추출 템플릿' : '이미지 추출 템플릿');
      setStep('preview');
    } catch {
      setStep('form');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // preview에서 저장
  async function handleSaveExtracted() {
    if (!title.trim()) { toast.error('제목을 입력해주세요'); return; }
    if (!templateTopic.trim()) { toast.error('문법 주제를 입력해주세요'); return; }

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
      await fetchWithToast('/api/naesin/templates', {
        body: {
          title,
          templateTopic,
          questions,
          answerKey,
          category: 'problem',
          mode: 'interactive',
        },
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${step === 'preview' ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <DialogHeader><DialogTitle>PDF/이미지에서 템플릿 추출</DialogTitle></DialogHeader>

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
                <Label htmlFor="tpl-pdf-title">제목</Label>
                <Input id="tpl-pdf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="템플릿 제목" required />
              </div>
              <div className="flex-1">
                <Label htmlFor="tpl-pdf-topic">문법 주제</Label>
                <Input id="tpl-pdf-topic" value={templateTopic} onChange={(e) => setTemplateTopic(e.target.value)} placeholder="예: to부정사, 관계대명사" required />
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

        {/* --- form 스텝 --- */}
        {step === 'form' && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
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
        )}
      </DialogContent>
    </Dialog>
  );
}
