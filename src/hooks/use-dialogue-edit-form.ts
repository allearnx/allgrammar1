import { useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinDialogue, NaesinDialogueSentence } from '@/types/naesin';

export function useDialogueEditForm(onUpdate: (updated: NaesinDialogue) => void) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSentences, setEditSentences] = useState<NaesinDialogueSentence[]>([]);
  const [saving, setSaving] = useState(false);

  function startEdit(dialogue: NaesinDialogue) {
    setEditingId(dialogue.id);
    setEditTitle(dialogue.title);
    setEditSentences(
      dialogue.sentences.map((s) => ({ original: s.original, korean: s.korean, speaker: s.speaker || '' })),
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditSentences([]);
  }

  function updateSentence(idx: number, field: keyof NaesinDialogueSentence, value: string) {
    setEditSentences((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addSentence(afterIdx?: number) {
    setEditSentences((prev) => {
      const newSentence: NaesinDialogueSentence = { original: '', korean: '', speaker: '' };
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

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await fetchWithToast<NaesinDialogue>('/api/naesin/dialogues', {
        method: 'PATCH',
        body: {
          id: editingId,
          title: editTitle,
          sentences: editSentences.map((s) => ({
            original: s.original,
            korean: s.korean,
            ...(s.speaker ? { speaker: s.speaker } : {}),
          })),
        },
        successMessage: '대화문이 수정되었습니다',
        errorMessage: '대화문 수정 중 오류가 발생했습니다',
        logContext: 'unit.save_dialogue',
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
    saving,
    startEdit,
    cancelEdit,
    updateSentence,
    addSentence,
    removeSentence,
    saveEdit,
  };
}
