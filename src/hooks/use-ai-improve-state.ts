import { useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/naesin';

interface IssueItem {
  questionNumber: number;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  improvedQuestion?: NaesinProblemQuestion;
}

interface TrapSuggestion {
  question: NaesinProblemQuestion;
  reason: string;
}

interface AnalysisResult {
  summary: string;
  score: number;
  issues: IssueItem[];
  trapSuggestions: TrapSuggestion[];
}

type Step = 'idle' | 'analyzing' | 'review';

export type { IssueItem, TrapSuggestion, AnalysisResult, Step };

interface UseAiImproveStateParams {
  sheet: NaesinProblemSheet;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: NaesinProblemSheet) => void;
}

export function useAiImproveState({ sheet, onOpenChange, onUpdate }: UseAiImproveStateParams) {
  const [step, setStep] = useState<Step>('idle');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [selectedTraps, setSelectedTraps] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);

  function resetState() {
    setStep('idle');
    setAnalysis(null);
    setSelectedIssues(new Set());
    setSelectedTraps(new Set());
    setApplying(false);
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) resetState();
  }

  async function handleAnalyze() {
    setStep('analyzing');
    try {
      const data = await fetchWithToast<{
        analysis: AnalysisResult;
      }>('/api/naesin/problems/ai-improve', {
        body: { sheetId: sheet.id },
        errorMessage: 'AI 분석에 실패했습니다.',
      });

      setAnalysis(data.analysis);

      const highIssues = new Set<number>();
      data.analysis.issues.forEach((issue, i) => {
        if (issue.severity === 'high' && issue.improvedQuestion) {
          highIssues.add(i);
        }
      });
      setSelectedIssues(highIssues);

      setStep('review');
    } catch {
      setStep('idle');
    }
  }

  function toggleIssue(idx: number) {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  function toggleTrap(idx: number) {
    setSelectedTraps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  async function handleApply() {
    if (!analysis) return;

    const questions = [...(sheet.questions || [])];

    for (const idx of selectedIssues) {
      const issue = analysis.issues[idx];
      if (!issue?.improvedQuestion) continue;
      const qIdx = questions.findIndex((q) => q.number === issue.questionNumber);
      if (qIdx !== -1) {
        questions[qIdx] = { ...issue.improvedQuestion, number: questions[qIdx].number };
      }
    }

    for (const idx of selectedTraps) {
      const trap = analysis.trapSuggestions[idx];
      if (!trap?.question) continue;
      questions.push({
        ...trap.question,
        number: questions.length + 1,
      });
    }

    const renumbered = questions.map((q, i) => ({ ...q, number: i + 1 }));
    const answerKey = renumbered.map((q) => q.answer);

    setApplying(true);
    try {
      const updated = await fetchWithToast<NaesinProblemSheet>('/api/naesin/problems', {
        method: 'PATCH',
        body: {
          id: sheet.id,
          questions: renumbered,
          answer_key: answerKey,
        },
        successMessage: '개선 사항이 적용되었습니다',
        errorMessage: '적용 중 오류가 발생했습니다',
      });
      onUpdate(updated);
      handleOpenChange(false);
    } catch { /* fetchWithToast handles toasts */ } finally {
      setApplying(false);
    }
  }

  const hasSelections = selectedIssues.size > 0 || selectedTraps.size > 0;

  return {
    step,
    analysis,
    selectedIssues,
    selectedTraps,
    applying,
    hasSelections,
    handleOpenChange,
    handleAnalyze,
    toggleIssue,
    toggleTrap,
    handleApply,
  };
}
