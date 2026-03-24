'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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
      const res = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        setEditingId(null);
        toast.success(messages.success);
      } else {
        toast.error(messages.error);
      }
    } catch (err) {
      if (err instanceof Error && err.message) {
        toast.error(err.message);
      } else {
        logger.error('hook.inline_edit', { error: err instanceof Error ? err.message : String(err) });
        toast.error(messages.error);
      }
    }
  }

  return { editingId, editForm, setEditForm, startEdit, cancelEdit, saveEdit };
}
