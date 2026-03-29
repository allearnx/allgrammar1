'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wand2, Loader2, FileUp, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinProblemQuestion } from '@/types/naesin';
import type { FullValidationResult } from '@/lib/validation';
import type { GeneratedQuestion } from './question-utils';
import { hasOptions, normalizeQuestions } from './question-utils';
import { QuestionEditRow, QuestionViewRow, ValidationBadgeIcon, QuestionBadge } from './question-table-rows';

type Step = 'upload' | 'loading' | 'preview';

export function PdfProblemExtractDialog({ unitId, unitTitle, onAdd }: { unitId: string; unitTitle?: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [originalCount, setOriginalCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [validation, setValidation] = useState<FullValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setStep('upload');
    setTitle('');
    setQuestions([]);
    setOriginalCount(0);
    setEditingIdx(null);
    setValidation(null);
    setValidating(false);
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
      if (data.validation?.structural) {
        setValidation({ structural: data.validation.structural, badge: data.validation.structural.valid ? 'pass' : 'fail', summary: '' });
      }
      setStep('preview');
      toast.success(`원본 ${data.originalCount}문제 → ${data.questions?.length || 0}문제 생성 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF 처리 중 오류 발생');
      setStep('upload');
    }

    e.target.value = '';
  }

  async function handleAiValidation() {
    if (questions.length === 0) return;
    setValidating(true);
    try {
      const formatted = questions.map((q, i) => ({
        number: i + 1,
        question: q.question,
        ...(hasOptions(q) ? { options: q.options } : {}),
        answer: q.answer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      }));

      const res = await fetch('/api/naesin/problems/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: formatted }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'AI 검증 실패');
      }

      const result: FullValidationResult = await res.json();
      setValidation(result);
      toast.success(`AI 검증 완료: ${result.summary}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 검증 실패');
    } finally {
      setValidating(false);
    }
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
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">원본 {originalCount}문제</Badge>
              <Badge variant="secondary">생성 {questions.length}문제</Badge>
              {mcqCount > 0 && <Badge variant="outline">객관식 {mcqCount}</Badge>}
              {subCount > 0 && <Badge variant="outline">서술형 {subCount}</Badge>}
              {validation && (
                <Badge
                  variant={validation.badge === 'pass' ? 'default' : validation.badge === 'warn' ? 'secondary' : 'destructive'}
                  className="gap-1"
                >
                  <ValidationBadgeIcon badge={validation.badge} />
                  {validation.summary || (validation.badge === 'pass' ? '검증 통과' : validation.badge === 'warn' ? '경고 있음' : '오류 있음')}
                </Badge>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleAiValidation}
              disabled={validating || questions.length === 0}
            >
              {validating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  AI 검증 중...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  AI 검증 실행
                </>
              )}
            </Button>

            <div className="rounded-lg border overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 w-10">#</th>
                    <th className="text-left p-2">문제</th>
                    <th className="text-left p-2 w-16">유형</th>
                    <th className="text-left p-2 w-20">정답</th>
                    <th className="text-left p-2 w-16">편집</th>
                    <th className="text-left p-2 w-10">검증</th>
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
                        <>
                          <QuestionViewRow question={q} onEdit={() => setEditingIdx(i)} />
                          <td className="p-2">
                            <QuestionBadge questionNumber={q.number} validation={validation} />
                          </td>
                        </>
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
