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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemQuestion } from '@/types/naesin';
import type { FullValidationResult } from '@/lib/validation';
import type { GeneratedQuestion } from './question-utils';
import { normalizeQuestions } from './question-utils';
import { QuestionEditRow, QuestionViewRow, ValidationBadgeIcon, QuestionBadge } from './question-table-rows';

type Step = 'input' | 'loading' | 'preview';

interface Props {
  unitId: string;
  grammarTitle?: string;
  grade?: string;
  onAdd: () => void;
}

export function AiProblemGenerateDialog({ unitId, grammarTitle, grade, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('input');

  // Form fields
  const [title, setTitle] = useState('');
  const [grammarTopic, setGrammarTopic] = useState('');
  const [focusPoints, setFocusPoints] = useState('');
  const [mcqCount, setMcqCount] = useState(15);
  const [selectAllCount, setSelectAllCount] = useState(3);
  const [subjectiveCount, setSubjectiveCount] = useState(2);
  const [trapPercent, setTrapPercent] = useState('20');

  // Preview state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [validation, setValidation] = useState<FullValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setStep('input');
    setTitle('');
    setGrammarTopic(grammarTitle || '');
    setFocusPoints('');
    setMcqCount(15);
    setSelectAllCount(3);
    setSubjectiveCount(2);
    setTrapPercent('20');
    setQuestions([]);
    setEditingIdx(null);
    setValidation(null);
    setValidating(false);
  }

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v) {
      setGrammarTopic(grammarTitle || '');
    } else {
      resetForm();
    }
  }

  async function handleGenerate() {
    if (!title.trim() || !grammarTopic.trim()) {
      toast.error('시트 제목과 문법 주제를 입력하세요.');
      return;
    }

    setStep('loading');
    try {
      const data = await fetchWithToast<{
        questions: Record<string, unknown>[];
        validation?: { structural: FullValidationResult['structural']; badge: string; summary: string };
      }>('/api/naesin/problems/ai-generate', {
        body: {
          unitId,
          title: title.trim(),
          grammarTopic: grammarTopic.trim(),
          focusPoints: focusPoints.trim() || undefined,
          grade: grade || '2',
          mcqCount,
          selectAllCount,
          subjectiveCount,
          trapPercent,
        },
        errorMessage: 'AI 문제 생성에 실패했습니다.',
      });

      setQuestions(normalizeQuestions(data.questions || []));
      if (data.validation?.structural) {
        const s = data.validation.structural;
        setValidation({
          structural: s,
          badge: s.valid ? 'pass' : 'fail',
          summary: data.validation.summary || '',
        });
      }
      setStep('preview');
      toast.success(`${data.questions?.length || 0}문제 생성 완료`);
    } catch {
      setStep('input');
    }
  }

  async function handleAiValidation() {
    if (questions.length === 0) return;
    setValidating(true);
    try {
      const formatted = questions.map((q, i) => ({
        number: i + 1,
        question: q.question,
        ...(q.options ? { options: q.options } : {}),
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
        ...(q.options ? { options: q.options } : {}),
        answer: q.answer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      }));

      const answerKey = questions.map((q) => q.answer);

      await fetchWithToast('/api/naesin/problems', {
        body: { unitId, title: title.trim(), mode: 'interactive', questions: formatted, answerKey, category: 'problem' },
        successMessage: `${formatted.length}문제 시트가 추가되었습니다`,
        errorMessage: '저장에 실패했습니다.',
      });
      onAdd();
      setOpen(false);
      resetForm();
    } catch { /* fetchWithToast handles toasts */ } finally {
      setSaving(false);
    }
  }

  const mcqTotal = questions.filter((q) => q.options !== null && q.options.length > 0).length;
  const subTotal = questions.length - mcqTotal;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          AI 문제 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI 문제 생성</DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              문법 주제와 출제 조건을 입력하면 AI가 객관식/모두고르시오/서술형 문제를 자동 생성합니다.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="ai-gen-title">시트 제목</Label>
                <Input
                  id="ai-gen-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="1과 AI 생성 문제"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="ai-gen-topic">문법 주제</Label>
                <Input
                  id="ai-gen-topic"
                  value={grammarTopic}
                  onChange={(e) => setGrammarTopic(e.target.value)}
                  placeholder="to부정사의 명사적/형용사적/부사적 용법"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="ai-gen-focus">출제 포인트 (선택)</Label>
                <Textarea
                  id="ai-gen-focus"
                  value={focusPoints}
                  onChange={(e) => setFocusPoints(e.target.value)}
                  placeholder="전치사 유무 (write with, sit on, drink Ø)&#10;decide/want + to부정사 vs. enjoy/mind + 동명사"
                  rows={3}
                />
              </div>

              <div>
                <Label>학년</Label>
                <Badge variant="secondary" className="ml-2">{grade || '2'}학년</Badge>
              </div>

              <div>
                <Label htmlFor="ai-gen-trap">함정 비율</Label>
                <Select value={trapPercent} onValueChange={setTrapPercent}>
                  <SelectTrigger id="ai-gen-trap" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ai-gen-mcq">일반 객관식</Label>
                <Input
                  id="ai-gen-mcq"
                  type="number"
                  min={0}
                  max={50}
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  className="h-8"
                />
              </div>

              <div>
                <Label htmlFor="ai-gen-select-all">모두 고르시오</Label>
                <Input
                  id="ai-gen-select-all"
                  type="number"
                  min={0}
                  max={10}
                  value={selectAllCount}
                  onChange={(e) => setSelectAllCount(Number(e.target.value))}
                  className="h-8"
                />
              </div>

              <div>
                <Label htmlFor="ai-gen-sub">서술형</Label>
                <Input
                  id="ai-gen-sub"
                  type="number"
                  min={0}
                  max={10}
                  value={subjectiveCount}
                  onChange={(e) => setSubjectiveCount(Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">생성 분배 (총 {mcqCount + selectAllCount + subjectiveCount}문제)</p>
              <p>일반 객관식 {mcqCount}개 / 모두고르시오 {selectAllCount}개 / 서술형 {subjectiveCount}개</p>
              <p>함정 비율 {trapPercent}% (객관식에서 약 {Math.max(1, Math.round(mcqCount * parseInt(trapPercent) / 100))}개)</p>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!title.trim() || !grammarTopic.trim() || (mcqCount + selectAllCount + subjectiveCount) === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI 문제 생성 시작
            </Button>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI 문제 생성 중... (최대 3분 소요)</p>
            <p className="text-xs text-muted-foreground">객관식 + 모두고르시오 + 서술형 병렬 생성</p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">총 {questions.length}문제</Badge>
              {mcqTotal > 0 && <Badge variant="outline">객관식 {mcqTotal}</Badge>}
              {subTotal > 0 && <Badge variant="outline">서술형 {subTotal}</Badge>}
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
