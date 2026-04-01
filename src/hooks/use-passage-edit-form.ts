import { useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinPassage } from '@/types/database';

export interface PassageSentence {
  original: string;
  korean: string;
  acceptedAnswers: string[];
}

export function usePassageEditForm(onUpdate: (updated: NaesinPassage) => void) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSentences, setEditSentences] = useState<PassageSentence[]>([]);
  const [editPdfUrl, setEditPdfUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(passage: NaesinPassage) {
    setEditingId(passage.id);
    setEditTitle(passage.title);
    setEditPdfUrl(passage.pdf_url || null);
    const sentences = Array.isArray(passage.sentences) && passage.sentences.length > 0
      ? passage.sentences.map((s) => ({ original: s.original, korean: s.korean, acceptedAnswers: s.acceptedAnswers || [] }))
      : [{ original: passage.original_text, korean: passage.korean_translation, acceptedAnswers: [] as string[] }];
    setEditSentences(sentences);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditSentences([]);
    setEditPdfUrl(null);
  }

  function updateSentence(idx: number, field: 'original' | 'korean', value: string) {
    setEditSentences((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addSentence(afterIdx?: number) {
    setEditSentences((prev) => {
      const newSentence: PassageSentence = { original: '', korean: '', acceptedAnswers: [] };
      if (afterIdx === undefined) return [...prev, newSentence];
      const copy = [...prev];
      copy.splice(afterIdx + 1, 0, newSentence);
      return copy;
    });
  }

  function removeSentence(idx: number) {
    if (editSentences.length <= 1) return;
    setEditSentences((prev) => prev.filter((_, i) => i !== idx));
  }

  function addAcceptedAnswer(sentenceIdx: number) {
    setEditSentences((prev) => prev.map((s, i) =>
      i === sentenceIdx ? { ...s, acceptedAnswers: [...s.acceptedAnswers, ''] } : s
    ));
  }

  function updateAcceptedAnswer(sentenceIdx: number, answerIdx: number, value: string) {
    setEditSentences((prev) => prev.map((s, i) =>
      i === sentenceIdx
        ? { ...s, acceptedAnswers: s.acceptedAnswers.map((a, j) => (j === answerIdx ? value : a)) }
        : s
    ));
  }

  function removeAcceptedAnswer(sentenceIdx: number, answerIdx: number) {
    setEditSentences((prev) => prev.map((s, i) =>
      i === sentenceIdx
        ? { ...s, acceptedAnswers: s.acceptedAnswers.filter((_, j) => j !== answerIdx) }
        : s
    ));
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await fetchWithToast<NaesinPassage>('/api/naesin/passages', {
        method: 'PATCH',
        body: {
          id: editingId,
          title: editTitle,
          pdf_url: editPdfUrl || null,
          sentences: editSentences.map((s) => ({
            original: s.original,
            korean: s.korean,
            ...(s.acceptedAnswers.filter(Boolean).length > 0
              ? { acceptedAnswers: s.acceptedAnswers.filter(Boolean) }
              : {}),
          })),
        },
        successMessage: '지문이 수정되었습니다',
        errorMessage: '지문 수정 중 오류가 발생했습니다',
        logContext: 'unit.save_passage',
      });
      onUpdate(updated);
      cancelEdit();
    } catch { /* fetchWithToast handles toasts/logging */ } finally {
      setSaving(false);
    }
  }

  return {
    editingId,
    editTitle,
    setEditTitle,
    editSentences,
    editPdfUrl,
    setEditPdfUrl,
    saving,
    startEdit,
    cancelEdit,
    updateSentence,
    addSentence,
    removeSentence,
    addAcceptedAnswer,
    updateAcceptedAnswer,
    removeAcceptedAnswer,
    saveEdit,
  };
}
