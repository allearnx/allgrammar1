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

  function updateAcceptedAnswers(idx: number, answers: string[]) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, acceptedAnswers: answers } : q))
    );
  }

  /** 정답 기반으로 허용 답안 자동 생성 */
  function generateAcceptedAnswers(idx: number) {
    const q = questions[idx];
    if (!q) return;

    const answer = String(q.answer).trim();
    if (!answer) return;

    const variants = new Set<string>();
    variants.add(answer);

    // 마침표 있는/없는 버전
    if (answer.endsWith('.')) {
      variants.add(answer.slice(0, -1));
    } else {
      variants.add(answer + '.');
    }

    // 첫 글자 대문자/소문자 변형
    for (const v of [...variants]) {
      if (v.length > 0) {
        variants.add(v.charAt(0).toUpperCase() + v.slice(1));
        variants.add(v.charAt(0).toLowerCase() + v.slice(1));
      }
    }

    // 하위 문항 (1) xxx (2) yyy 형태 감지 및 변형
    const subItemPattern = /\(\d+\)\s*[^()]+/g;
    const subItems = answer.match(subItemPattern);
    if (subItems && subItems.length > 1) {
      // 각 하위 문항 사이에 줄바꿈 또는 콤마로 분리한 변형
      const items = subItems.map((s) => s.trim());
      variants.add(items.join(' '));
      variants.add(items.join(', '));
      variants.add(items.join('\n'));
    }

    // 원본 답은 제외 (이미 referenceAnswer로 비교됨)
    variants.delete(answer);

    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, acceptedAnswers: [...variants] } : q))
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
    updateAcceptedAnswers,
    generateAcceptedAnswers,
  };
}
