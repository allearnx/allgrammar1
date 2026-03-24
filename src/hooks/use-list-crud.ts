'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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
      const res = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((v) => v.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success(messages.deleteSuccess);
      } else {
        toast.error('삭제 실패');
      }
    } catch (err) {
      logger.error('hook.list_crud', { error: err instanceof Error ? err.message : String(err) });
      toast.error(messages.deleteError);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(apiEndpoint, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        )
      );
      const successCount = results.filter((r) => r.ok).length;
      setItems((prev) => prev.filter((v) => !selectedIds.has(v.id)));
      setSelectedIds(new Set());
      toast.success(messages.bulkSuccess(successCount));
    } catch (err) {
      logger.error('hook.list_crud', { error: err instanceof Error ? err.message : String(err) });
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
