'use client';

import { useState, useRef } from 'react';
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
import { Wand2, Loader2, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinProblemQuestion } from '@/types/naesin';

export interface GeneratedQuestion {
  number: number;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
}

type Step = 'upload' | 'loading' | 'preview';

export function hasOptions(q: GeneratedQuestion): boolean {
  return q.options !== null && q.options.length > 0;
}

/** AI 응답을 정규화: options/explanation을 일관된 타입으로 */
function normalizeQuestions(raw: Record<string, unknown>[]): GeneratedQuestion[] {
  return raw.map((q, i) => ({
    number: (q.number as number) || i + 1,
    question: (q.question as string) || '',
    options: Array.isArray(q.options) && q.options.length > 0 ? q.options as string[] : null,
    answer: String(q.answer ?? ''),
    explanation: (q.explanation as string) || '',
  }));
}

export function QuestionEditRow({
  question,
  onUpdate,
  onUpdateOption,
  onDone,
}: {
  question: GeneratedQuestion;
  onUpdate: (field: keyof GeneratedQuestion, value: string) => void;
  onUpdateOption: (optIdx: number, value: string) => void;
  onDone: () => void;
}) {
  return (
    <td colSpan={5} className="p-3 space-y-2">
      <div>
        <Label className="text-xs">문제</Label>
        <Textarea
          value={question.question}
          onChange={(e) => onUpdate('question', e.target.value)}
          rows={2}
        />
      </div>
      {hasOptions(question) && (
        <div className="grid grid-cols-5 gap-1">
          {question.options!.map((opt, oi) => (
            <Input
              key={oi}
              value={opt}
              onChange={(e) => onUpdateOption(oi, e.target.value)}
              className="text-xs"
            />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">정답</Label>
          <Input value={question.answer} onChange={(e) => onUpdate('answer', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">해설</Label>
          <Input value={question.explanation} onChange={(e) => onUpdate('explanation', e.target.value)} />
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onDone}>편집 완료</Button>
    </td>
  );
}

export function QuestionViewRow({
  question,
  onEdit,
}: {
  question: GeneratedQuestion;
  onEdit: () => void;
}) {
  return (
    <>
      <td className="p-2">{question.number}</td>
      <td className="p-2 whitespace-pre-wrap break-words">{question.question}</td>
      <td className="p-2">
        <Badge variant={hasOptions(question) ? 'outline' : 'secondary'} className="text-xs">
          {hasOptions(question) ? '객관식' : '서술형'}
        </Badge>
      </td>
      <td className="p-2 text-xs">{question.answer}</td>
      <td className="p-2">
        <Button size="sm" variant="ghost" onClick={onEdit}>수정</Button>
      </td>
    </>
  );
}

export function PdfProblemExtractDialog({ unitId, unitTitle, onAdd }: { unitId: string; unitTitle?: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [originalCount, setOriginalCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setStep('upload');
    setTitle('');
    setQuestions([]);
    setOriginalCount(0);
    setEditingIdx(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('PDF 파일만 업로드 가능합니다.');
      return;
    }

    setStep('loading');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      const res = await fetch('/api/naesin/problems/extract-paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          unitTitle: unitTitle || '',
          pdfBase64: base64,
          mediaType: 'application/pdf',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'AI 문제 생성에 실패했습니다.');
      }

      const data = await res.json();
      setQuestions(normalizeQuestions(data.questions || []));
      setOriginalCount(data.originalCount || 0);
      setStep('preview');
      toast.success(`원본 ${data.originalCount}문제 → ${data.questions?.length || 0}문제 생성 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF 처리 중 오류 발생');
      setStep('upload');
    }

    e.target.value = '';
  }

  function updateQuestion(idx: number, field: keyof GeneratedQuestion, value: string) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || !q.options) return q;
        const newOptions = [...q.options];
        newOptions[optIdx] = value;
        return { ...q, options: newOptions };
      })
    );
  }

  async function handleSubmit() {
    if (questions.length === 0 || !title.trim()) return;
    setSaving(true);
    try {
      const formatted: NaesinProblemQuestion[] = questions.map((q, i) => ({
        number: i + 1,
        question: q.question,
        ...(hasOptions(q) ? { options: q.options! } : {}),
        answer: q.answer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      }));

      const answerKey = questions.map((q) => q.answer);

      const res = await fetch('/api/naesin/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          title: title.trim(),
          mode: 'interactive',
          questions: formatted,
          answerKey,
          category: 'problem',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '저장에 실패했습니다.');
      }

      onAdd();
      setOpen(false);
      resetForm();
      toast.success(`${formatted.length}문제 시트가 추가되었습니다`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  const mcqCount = questions.filter(hasOptions).length;
  const subCount = questions.length - mcqCount;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Wand2 className="h-3.5 w-3.5 mr-1" />
          PDF 패러프레이징
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDF 문제 패러프레이징</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              문법 문제 PDF를 업로드하면 AI가 문제를 추출하고 패러프레이징하여 50문제를 자동 생성합니다.
            </p>
            <div>
              <Label htmlFor="pdf-paraphrase-title">시트 제목</Label>
              <Input
                id="pdf-paraphrase-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="1과 패러프레이징 문제"
              />
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              <Button className="w-full" onClick={() => fileInputRef.current?.click()} disabled={!title.trim()}>
                <FileUp className="h-4 w-4 mr-2" />
                PDF 업로드 및 생성 시작
              </Button>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">생성 분배 (총 50문제)</p>
              <p>객관식: 빈칸 채우기 10 / 영작 선택 5 / 용법 구별 10 / 어법 판단 7</p>
              <p>서술형: 영작 8 / 어순 배열 5 / 오류 수정 5</p>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI 문제 생성 중... (최대 5분 소요)</p>
            <p className="text-xs text-muted-foreground">PDF 추출 → 패러프레이징 → 50문제 생성</p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">원본 {originalCount}문제</Badge>
              <Badge variant="secondary">생성 {questions.length}문제</Badge>
              {mcqCount > 0 && <Badge variant="outline">객관식 {mcqCount}</Badge>}
              {subCount > 0 && <Badge variant="outline">서술형 {subCount}</Badge>}
            </div>

            <div className="rounded-lg border overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 w-10">#</th>
                    <th className="text-left p-2">문제</th>
                    <th className="text-left p-2 w-16">유형</th>
                    <th className="text-left p-2 w-20">정답</th>
                    <th className="text-left p-2 w-16">편집</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={i} className="border-t">
                      {editingIdx === i ? (
                        <QuestionEditRow
                          question={q}
                          onUpdate={(field, value) => updateQuestion(i, field, value)}
                          onUpdateOption={(optIdx, value) => updateOption(i, optIdx, value)}
                          onDone={() => setEditingIdx(null)}
                        />
                      ) : (
                        <QuestionViewRow question={q} onEdit={() => setEditingIdx(i)} />
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={saving || !title.trim()}>
              {saving ? '저장 중...' : `${questions.length}문제 시트 저장`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
