'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface UseListCrudMessages {
  deleteSuccess: string;
  deleteError: string;
  bulkSuccess: (n: number) => string;
  bulkError: string;
}

export function useListCrud<T extends { id: string }>(options: {
  apiEndpoint: string;
  messages: UseListCrudMessages;
}) {
  const { apiEndpoint, messages } = options;
  const [items, setItems] = useState<T[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteOne(id: string) {
    try {
      await fetchWithToast(apiEndpoint, {
        method: 'DELETE',
        body: { id },
        successMessage: messages.deleteSuccess,
        errorMessage: messages.deleteError,
      });
      setItems((prev) => prev.filter((v) => v.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch { /* fetchWithToast handles toasts */ }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          fetchWithToast(apiEndpoint, {
            method: 'DELETE',
            body: { id },
            silent: true,
          })
        )
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      setItems((prev) => prev.filter((v) => !selectedIds.has(v.id)));
      setSelectedIds(new Set());
      toast.success(messages.bulkSuccess(successCount));
    } catch {
      toast.error(messages.bulkError);
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((v) => v.id)));
    }
  }

  return {
    items,
    setItems: setItems as Dispatch<SetStateAction<T[]>>,
    selectedIds,
    setSelectedIds,
    deleting,
    handleDeleteOne,
    handleBulkDelete,
    toggleSelect,
    toggleSelectAll,
  };
}
