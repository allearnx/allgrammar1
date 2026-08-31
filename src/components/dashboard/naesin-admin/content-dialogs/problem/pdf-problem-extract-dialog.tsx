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
import { chunkPreservingGroups } from '@/lib/naesin/paraphrase-chunks';
import { QuestionEditRow, QuestionViewRow, ValidationBadgeIcon, QuestionBadge } from '../shared/question-table-rows';
import { useQuestionEditor } from '@/hooks/use-question-editor';

type Step = 'upload' | 'loading' | 'preview';

export function PdfProblemExtractDialog({ unitId, unitTitle, onAdd }: { unitId: string; unitTitle?: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [title, setTitle] = useState('');
  const editor = useQuestionEditor();
  const [originalCount, setOriginalCount] = useState(0);
  const [extractedTotal, setExtractedTotal] = useState(0);
  const [halfSampling, setHalfSampling] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<FullValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setStep('upload');
    setTitle('');
    editor.setQuestions([]);
    setOriginalCount(0);
    setExtractedTotal(0);
    setProgress(null);
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
    setProgress(null);

    try {
      const { uploadForExtract } = await import('@/lib/upload-for-extract');
      const { publicUrl, storagePath } = await uploadForExtract(file);

      // 1단계: 원본 문제 추출 (빠름 — Haiku 병렬)
      const extracted = await fetchWithToast<{ questions?: Record<string, unknown>[]; originalCount?: number; extractedTotal?: number; removedImageCount?: number }>(
        '/api/naesin/problems/extract-paraphrase',
        { body: { unitId, phase: 'extract', pdfUrl: publicUrl, storagePath, halfSampling }, errorMessage: 'PDF에서 문제 추출에 실패했습니다.' },
      );
      if (extracted.removedImageCount) {
        toast.info(`그림·사진 의존 문항 ${extracted.removedImageCount}개는 화면에서 풀 수 없어 제외했습니다`);
      }
      setExtractedTotal(extracted.extractedTotal ?? extracted.questions?.length ?? 0);
      if (halfSampling && extracted.extractedTotal && extracted.questions && extracted.extractedTotal > extracted.questions.length) {
        toast.info(`전체 ${extracted.extractedTotal}문항 중 절반 추출로 ${extracted.questions.length}문항을 사용합니다`);
      }
      const originals = extracted.questions || [];
      if (originals.length === 0) {
        toast.error('PDF에서 문제를 추출하지 못했습니다.');
        setStep('upload');
        e.target.value = '';
        return;
      }
      setOriginalCount(originals.length);

      // 2단계: 배치 변형 — 대형 PDF를 한 요청으로 변형하면 서버 제한시간·AI 동시
      // 호출 한도에 걸리므로 ~24문항(지문 그룹 보존)씩 나눠 최대 3요청 동시 진행
      const groupChunks = chunkPreservingGroups(originals, 12);
      const batches: Record<string, unknown>[][] = [];
      for (let i = 0; i < groupChunks.length; i += 2) {
        batches.push([...groupChunks[i], ...(groupChunks[i + 1] || [])]);
      }
      setProgress({ done: 0, total: originals.length });
      const results: Record<string, unknown>[][] = new Array(batches.length);
      let nextBatch = 0;
      let doneCount = 0;
      const worker = async () => {
        while (nextBatch < batches.length) {
          const idx = nextBatch++;
          const res = await fetchWithToast<{ questions?: Record<string, unknown>[] }>(
            '/api/naesin/problems/extract-paraphrase',
            { body: { unitId, unitTitle: unitTitle || '', phase: 'paraphrase', questions: batches[idx] }, errorMessage: 'AI 문제 변형에 실패했습니다.' },
          );
          results[idx] = res.questions || [];
          doneCount += batches[idx].length;
          setProgress({ done: doneCount, total: originals.length });
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, batches.length) }, () => worker()));

      const merged = results.flat().map((q, i) => ({ ...q, number: i + 1 }));
      const normalized = normalizeQuestions(merged);
      editor.setQuestions(normalized);
      refreshStructural(normalized);
      setStep('preview');
      toast.success(`원본 ${originals.length}문제 → ${merged.length}문제 생성 완료`);
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
            <label className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={halfSampling}
                onChange={(e) => setHalfSampling(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium">문항 절반만 추출</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  유형 묶음별로 1·3·5번째만 사용합니다. 지시문·보기 상자는 유지되고, 같은 유형이
                  대량 반복되는 워크북에서 문항 수를 절반으로 줄입니다.
                </span>
              </span>
            </label>
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">1:1 패러프레이즈</p>
              <p>추출된 문항을 유형(객관식/서술형)과 순서 그대로 변형합니다</p>
              <p>30문제가 넘으면 저장 시 30문제 안팎의 세트 시트로 자동 분할됩니다</p>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            {progress ? (
              <>
                <p className="text-sm font-medium">
                  원본 {originalCount}문항 추출 완료 — AI 변형 중 ({progress.done}/{progress.total})
                </p>
                <div className="w-64 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">문항이 많으면 몇 분 걸릴 수 있어요 — 창을 닫지 마세요</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">PDF에서 원본 문제 추출 중...</p>
                <p className="text-xs text-muted-foreground">추출이 끝나면 문항 단위 변형 진행률이 표시됩니다</p>
              </>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">
                원본 {originalCount}문제{extractedTotal > originalCount ? ` (전체 ${extractedTotal} 중 절반 추출)` : ''}
              </Badge>
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
