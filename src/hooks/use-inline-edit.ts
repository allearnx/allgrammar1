'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export function useInlineEdit<TItem extends { id: string }, TForm>(
  options: {
    apiEndpoint: string;
    toForm: (item: TItem) => TForm;
    toPayload: (id: string, form: TForm) => Record<string, unknown>;
    messages: { success: string; error: string };
  },
  setItems: Dispatch<SetStateAction<TItem[]>>,
) {
  const { apiEndpoint, toForm, toPayload, messages } = options;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TForm>({} as TForm);

  function startEdit(item: TItem) {
    setEditingId(item.id);
    setEditForm(toForm(item));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      const payload = toPayload(editingId, editForm);
      const updated = await fetchWithToast<TItem>(apiEndpoint, {
        method: 'PATCH',
        body: payload,
        successMessage: messages.success,
        errorMessage: messages.error,
      });
      setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      setEditingId(null);
    } catch { /* fetchWithToast handles toasts */ }
  }

  return { editingId, editForm, setEditForm, startEdit, cancelEdit, saveEdit };
}
