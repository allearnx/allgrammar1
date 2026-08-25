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
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemQuestion } from '@/types/naesin';
import type { FullValidationResult } from '@/lib/validation';
import { validateProblemStructure } from '@/lib/validation/problem-validator';
import type { GeneratedQuestion } from '../shared/question-utils';
import { hasOptions, normalizeQuestions, splitQuestionsIntoSets } from '../shared/question-utils';
import { QuestionEditRow, QuestionViewRow, ValidationBadgeIcon, QuestionBadge } from '../shared/question-table-rows';
import { useQuestionEditor } from '@/hooks/use-question-editor';

type Step = 'upload' | 'loading' | 'preview';

export function PdfProblemExtractDialog({ unitId, unitTitle, onAdd }: { unitId: string; unitTitle?: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [title, setTitle] = useState('');
  const editor = useQuestionEditor();
  const [originalCount, setOriginalCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<FullValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setStep('upload');
    setTitle('');
    editor.setQuestions([]);
    setOriginalCount(0);
    editor.setEditingIdx(null);
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
      const { uploadForExtract } = await import('@/lib/upload-for-extract');
      const { publicUrl, storagePath } = await uploadForExtract(file);

      const data = await fetchWithToast<{ questions?: Record<string, unknown>[]; originalCount?: number; validation?: { structural: FullValidationResult['structural'] } }>(
        '/api/naesin/problems/extract-paraphrase',
        { body: { unitId, unitTitle: unitTitle || '', pdfUrl: publicUrl, storagePath }, errorMessage: 'AI 문제 생성에 실패했습니다.' },
      );
      editor.setQuestions(normalizeQuestions(data.questions || []));
      setOriginalCount(data.originalCount || 0);
      if (data.validation?.structural) {
        const s = data.validation.structural;
        setValidation({ structural: s, badge: s.valid ? 'pass' : 'fail', summary: '' });
      }
      setStep('preview');
      toast.success(`원본 ${data.originalCount}문제 → ${data.questions?.length || 0}문제 생성 완료`);
    } catch {
      setStep('upload');
    }

    e.target.value = '';
  }

  function formatForValidation(qs: GeneratedQuestion[]): NaesinProblemQuestion[] {
    return qs.map((q, i) => ({
      number: i + 1,
      question: q.question,
      ...(hasOptions(q) ? { options: q.options! } : {}),
      answer: q.answer,
      ...(q.explanation ? { explanation: q.explanation } : {}),
    }));
  }

  /** 문항 삭제/수정 후 구조 검증을 로컬로 재계산 (AI 검증 결과는 번호가 바뀌므로 리셋) */
  function refreshStructural(qs: GeneratedQuestion[]) {
    if (qs.length === 0) { setValidation(null); return; }
    const s = validateProblemStructure(formatForValidation(qs));
    setValidation({ structural: s, badge: s.valid ? (s.warningCount > 0 ? 'warn' : 'pass') : 'fail', summary: '' });
  }

  function handleDeleteQuestion(idx: number) {
    const next = editor.questions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, number: i + 1 }));
    editor.deleteQuestion(idx);
    refreshStructural(next);
  }

  function handleDeleteErrorQuestions() {
    if (!validation) return;
    const errNums = new Set(
      validation.structural.issues
        .filter((i) => i.severity === 'error' && i.questionNumber != null)
        .map((i) => i.questionNumber),
    );
    if (errNums.size === 0) return;
    const next = editor.questions
      .filter((_, i) => !errNums.has(i + 1))
      .map((q, i) => ({ ...q, number: i + 1 }));
    editor.setQuestions(next);
    editor.setEditingIdx(null);
    refreshStructural(next);
    toast.success(`오류 문항 ${errNums.size}개를 삭제했습니다`);
  }

  async function handleAiValidation() {
    if (editor.questions.length === 0) return;
    setValidating(true);
    try {
      const formatted = editor.questions.map((q, i) => ({
        number: i + 1,
        question: q.question,
        ...(hasOptions(q) ? { options: q.options } : {}),
        answer: q.answer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      }));

      const result = await fetchWithToast<FullValidationResult>('/api/naesin/problems/validate', {
        body: { questions: formatted },
        errorMessage: 'AI 검증 실패',
      });
      setValidation(result);
      toast.success(`AI 검증 완료: ${result.summary}`);
    } catch { /* fetchWithToast handles error toast */ } finally {
      setValidating(false);
    }
  }

  async function handleSubmit() {
    if (editor.questions.length === 0 || !title.trim()) return;
    setSaving(true);
    const sets = splitQuestionsIntoSets(editor.questions);
    let savedCount = 0;
    try {
      for (let si = 0; si < sets.length; si++) {
        const set = sets[si];
        const formatted: NaesinProblemQuestion[] = set.map((q, i) => ({
          number: i + 1,
          question: q.question,
          ...(hasOptions(q) ? { options: q.options! } : {}),
          answer: q.answer,
          ...(q.explanation ? { explanation: q.explanation } : {}),
        }));
        const answerKey = set.map((q) => q.answer);
        const sheetTitle = sets.length > 1 ? `${title.trim()} (${si + 1}/${sets.length})` : title.trim();

        await fetchWithToast('/api/naesin/problems', {
          body: { unitId, title: sheetTitle, mode: 'interactive', questions: formatted, answerKey, category: 'problem' },
          errorMessage: `"${sheetTitle}" 저장 실패`,
          logContext: 'admin.paraphrase_save',
        });
        savedCount++;
      }
      toast.success(
        sets.length > 1
          ? `${editor.questions.length}문제가 ${sets.length}개 세트 시트로 저장되었습니다`
          : `${editor.questions.length}문제 시트가 추가되었습니다`,
      );
      onAdd();
      setOpen(false);
      resetForm();
    } catch {
      if (savedCount > 0) {
        toast.warning(`${savedCount}/${sets.length}개 세트 저장 완료, 나머지 실패`);
        onAdd();
      }
    } finally {
      setSaving(false);
    }
  }

  const { questions } = editor;
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
              문제 PDF를 업로드하면 AI가 원본 문제를 추출한 뒤 1:1로 패러프레이징합니다
              (문항 수·유형·순서 유지, 문장·소재만 교체).
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
              <p className="font-medium text-foreground">1:1 패러프레이즈</p>
              <p>원본이 40문제면 40문제 — 유형(객관식/서술형)과 순서를 그대로 따라갑니다</p>
              <p>30문제가 넘으면 저장 시 30문제 안팎의 세트 시트로 자동 분할됩니다</p>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI 문제 생성 중... (최대 5분 소요)</p>
            <p className="text-xs text-muted-foreground">PDF 추출 → 원본 1:1 패러프레이징</p>
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

            {validation && validation.structural.errorCount > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-destructive">구조 오류 {validation.structural.errorCount}건</p>
                  <Button size="sm" variant="destructive" onClick={handleDeleteErrorQuestions}>
                    오류 문항 모두 삭제
                  </Button>
                </div>
                <ul className="space-y-0.5 text-destructive/90">
                  {validation.structural.issues
                    .filter((i) => i.severity === 'error')
                    .slice(0, 15)
                    .map((issue, k) => <li key={k}>· {issue.message}</li>)}
                  {validation.structural.issues.filter((i) => i.severity === 'error').length > 15 && (
                    <li>· 외 {validation.structural.issues.filter((i) => i.severity === 'error').length - 15}건</li>
                  )}
                </ul>
              </div>
            )}

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
                      {editor.editingIdx === i ? (
                        <QuestionEditRow
                          question={q}
                          onUpdate={(field, value) => editor.updateQuestion(i, field, value)}
                          onUpdateOption={(optIdx, value) => editor.updateOption(i, optIdx, value)}
                          onDone={() => editor.setEditingIdx(null)}
                        />
                      ) : (
                        <>
                          <QuestionViewRow question={q} onEdit={() => editor.setEditingIdx(i)} onDelete={() => handleDeleteQuestion(i)} />
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
              {saving
                ? '저장 중...'
                : (() => {
                    const setCount = splitQuestionsIntoSets(questions).length;
                    return setCount > 1
                      ? `${questions.length}문제 저장 (${setCount}개 세트 시트로 분할)`
                      : `${questions.length}문제 시트 저장`;
                  })()}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
