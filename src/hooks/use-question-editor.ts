import { useState } from 'react';
import type { GeneratedQuestion } from '@/components/dashboard/naesin-admin/content-dialogs/question-utils';

export function useQuestionEditor(initial: GeneratedQuestion[] = []) {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>(initial);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

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

  function deleteQuestion(idx: number) {
    setQuestions((prev) =>
      prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 }))
    );
    setEditingIdx(null);
  }

  function toggleQuestionType(idx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        if (q.options && q.options.length > 0) {
          return { ...q, options: null, answer: '' };
        }
        return { ...q, options: ['', '', '', '', ''], answer: '' };
      })
    );
  }

  return {
    questions,
    setQuestions,
    editingIdx,
    setEditingIdx,
    updateQuestion,
    updateOption,
    deleteQuestion,
    toggleQuestionType,
  };
}
