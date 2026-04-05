'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemQuestion } from '@/types/naesin';
import type { FullValidationResult } from '@/lib/validation';
import { normalizeQuestions } from './question-utils';
import { useQuestionEditor } from '@/hooks/use-question-editor';
import { GenerateInputForm } from './generate-input-form';
import { GeneratePreviewStep } from './generate-preview-step';

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
  const editor = useQuestionEditor();
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
    editor.setQuestions([]);
    editor.setEditingIdx(null);
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

      editor.setQuestions(normalizeQuestions(data.questions || []));
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
    if (editor.questions.length === 0) return;
    setValidating(true);
    try {
      const formatted = editor.questions.map((q, i) => ({
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

  async function handleSubmit() {
    if (editor.questions.length === 0 || !title.trim()) return;
    setSaving(true);
    try {
      const formatted: NaesinProblemQuestion[] = editor.questions.map((q, i) => ({
        number: i + 1,
        question: q.question,
        ...(q.options ? { options: q.options } : {}),
        answer: q.answer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      }));

      const answerKey = editor.questions.map((q) => q.answer);

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
          <GenerateInputForm
            title={title}
            setTitle={setTitle}
            grammarTopic={grammarTopic}
            setGrammarTopic={setGrammarTopic}
            focusPoints={focusPoints}
            setFocusPoints={setFocusPoints}
            mcqCount={mcqCount}
            setMcqCount={setMcqCount}
            selectAllCount={selectAllCount}
            setSelectAllCount={setSelectAllCount}
            subjectiveCount={subjectiveCount}
            setSubjectiveCount={setSubjectiveCount}
            trapPercent={trapPercent}
            setTrapPercent={setTrapPercent}
            grade={grade}
            onGenerate={handleGenerate}
          />
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI 문제 생성 중... (최대 3분 소요)</p>
            <p className="text-xs text-muted-foreground">객관식 + 모두고르시오 + 서술형 병렬 생성</p>
          </div>
        )}

        {step === 'preview' && (
          <GeneratePreviewStep
            questions={editor.questions}
            editor={editor}
            validation={validation}
            validating={validating}
            saving={saving}
            onValidate={handleAiValidation}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
