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

/** AI 검산(3단계)이 지적한 문항 — number는 미리보기 목록의 현재 번호 기준 */
interface VerifyIssue {
  number: number;
  verdict: string; // 'wrong' | 'broken'
  aiAnswer?: string;
  reason?: string;
}

export function PdfProblemExtractDialog({ unitId, unitTitle, onAdd }: { unitId: string; unitTitle?: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [title, setTitle] = useState('');
  const editor = useQuestionEditor();
  const [originalCount, setOriginalCount] = useState(0);
  const [extractedTotal, setExtractedTotal] = useState(0);
  const [halfSampling, setHalfSampling] = useState(true);
  const [aiVerify, setAiVerify] = useState(true);
  const [verifyIssues, setVerifyIssues] = useState<VerifyIssue[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; stage: 'paraphrase' | 'verify' } | null>(null);
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
    setVerifyIssues([]);
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
        toast.info(`전체 ${extracted.extractedTotal}문항 중 일부 추출로 ${extracted.questions.length}문항을 사용합니다`);
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
      setProgress({ done: 0, total: originals.length, stage: 'paraphrase' });
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
          setProgress({ done: doneCount, total: originals.length, stage: 'paraphrase' });
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, batches.length) }, () => worker()));

      const merged = results.flat().map((q, i) => ({ ...q, number: i + 1 }));
      const normalized = normalizeQuestions(merged);

      // 3단계: AI 검산 — 변형된 문항을 정답을 가리고 다시 풀어 정답 오류·성립 불가를
      // 저장 전에 잡음 (변형 AI의 문법 오답이 코드 검증을 통과하는 사고 방지).
      // 검산 실패는 파이프라인을 막지 않음 — 지적 없이 미리보기로 진행.
      const issues: VerifyIssue[] = [];
      if (aiVerify && normalized.length > 0) {
        const verifyInput = normalized.map((q, i) => ({
          number: i + 1,
          question: q.question,
          ...(hasOptions(q) ? { options: q.options } : {}),
          answer: q.answer,
          ...(q.explanation ? { explanation: q.explanation } : {}),
        }));
        const VERIFY_BATCH = 24;
        const vBatches: typeof verifyInput[] = [];
        for (let i = 0; i < verifyInput.length; i += VERIFY_BATCH) {
          vBatches.push(verifyInput.slice(i, i + VERIFY_BATCH));
        }
        setProgress({ done: 0, total: normalized.length, stage: 'verify' });
        let nextV = 0;
        let doneV = 0;
        const vWorker = async () => {
          while (nextV < vBatches.length) {
            const idx = nextV++;
            try {
              const res = await fetchWithToast<{ issues?: VerifyIssue[] }>(
                '/api/naesin/problems/extract-paraphrase',
                { body: { unitId, unitTitle: unitTitle || '', phase: 'verify', questions: vBatches[idx] }, errorMessage: 'AI 검산 요청 실패 (해당 배치는 건너뜀)' },
              );
              issues.push(...(res.issues || []));
            } catch { /* 검산 실패는 치명적이지 않음 — 배치 건너뜀 */ }
            doneV += vBatches[idx].length;
            setProgress({ done: doneV, total: normalized.length, stage: 'verify' });
          }
        };
        await Promise.all(Array.from({ length: Math.min(3, vBatches.length) }, () => vWorker()));
        issues.sort((a, b) => a.number - b.number);
      }

      editor.setQuestions(normalized);
      setVerifyIssues(issues);
      refreshStructural(normalized);
      setStep('preview');
      if (issues.length > 0) {
        toast.warning(`AI 검산에서 ${issues.length}개 문항이 지적되었습니다 — 목록을 확인하세요`);
      }
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

  /** 문항 삭제 시 검산 지적 목록의 번호를 같이 당김 (삭제된 번호의 지적은 제거) */
  function shiftVerifyIssues(deletedNums: Set<number>) {
    setVerifyIssues((prev) =>
      prev
        .filter((v) => !deletedNums.has(v.number))
        .map((v) => ({
          ...v,
          number: v.number - [...deletedNums].filter((n) => n < v.number).length,
        })),
    );
  }

  function handleDeleteQuestion(idx: number) {
    const next = editor.questions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, number: i + 1 }));
    editor.deleteQuestion(idx);
    shiftVerifyIssues(new Set([idx + 1]));
    refreshStructural(next);
  }

  function handleDeleteErrorQuestions() {
    if (!validation) return;
    const errNums = new Set(
      validation.structural.issues
        .flatMap((i) => (i.severity === 'error' && i.questionNumber != null ? [i.questionNumber] : [])),
    );
    if (errNums.size === 0) return;
    const next = editor.questions
      .filter((_, i) => !errNums.has(i + 1))
      .map((q, i) => ({ ...q, number: i + 1 }));
    editor.setQuestions(next);
    editor.setEditingIdx(null);
    shiftVerifyIssues(errNums);
    refreshStructural(next);
    toast.success(`오류 문항 ${errNums.size}개를 삭제했습니다`);
  }

  function handleDeleteVerifyIssueQuestions() {
    const nums = new Set(verifyIssues.map((v) => v.number));
    if (nums.size === 0) return;
    const next = editor.questions
      .filter((_, i) => !nums.has(i + 1))
      .map((q, i) => ({ ...q, number: i + 1 }));
    editor.setQuestions(next);
    editor.setEditingIdx(null);
    setVerifyIssues([]);
    refreshStructural(next);
    toast.success(`AI 검산 지적 문항 ${nums.size}개를 삭제했습니다`);
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
                <span className="font-medium">문항 일부만 추출 (약 40%)</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  유형 묶음별로 5문항마다 2개(1·3번째)만 사용합니다. 지시문·보기 상자는 유지되고, 같은 유형이
                  대량 반복되는 워크북에서 문항 수와 학습 부담을 크게 줄입니다.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aiVerify}
                onChange={(e) => setAiVerify(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium">AI 검산 (권장)</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  변형이 끝난 모든 문항을 AI가 정답을 가리고 다시 풀어, 정답 오류·복수 정답·풀 수 없는
                  문항을 저장 전에 지적합니다. 시간이 몇 분 더 걸립니다.
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
                  {progress.stage === 'verify'
                    ? `변형 완료 — AI 검산 중 (${progress.done}/${progress.total})`
                    : `원본 ${originalCount}문항 추출 완료 — AI 변형 중 (${progress.done}/${progress.total})`}
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
                원본 {originalCount}문제{extractedTotal > originalCount ? ` (전체 ${extractedTotal}  중 일부 추출)` : ''}
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

            {verifyIssues.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    AI 검산 지적 {verifyIssues.length}건 — 확인 후 수정하거나 삭제하세요
                  </p>
                  <Button size="sm" variant="outline" onClick={handleDeleteVerifyIssueQuestions}>
                    지적 문항 모두 삭제
                  </Button>
                </div>
                <ul className="space-y-1">
                  {verifyIssues.map((v, k) => (
                    <li key={k}>
                      · <span className="font-medium">#{v.number}</span>{' '}
                      <span className="text-xs rounded bg-amber-500/15 px-1">
                        {v.verdict === 'broken' ? '성립 불가' : '정답 오류'}
                      </span>{' '}
                      {v.reason}
                      {v.aiAnswer ? <span className="text-muted-foreground"> (AI 풀이: {v.aiAnswer})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
