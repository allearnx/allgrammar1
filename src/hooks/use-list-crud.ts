'use client';

import { useState, useCallback, useRef, useMemo, type Dispatch, type SetStateAction } from 'react';
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
  const optRef = useRef(options);
  optRef.current = options;

  const [items, setItems] = useState<T[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Refs for stable access in callbacks without stale closures
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const handleDeleteOne = useCallback(async (id: string) => {
    const { apiEndpoint, messages } = optRef.current;
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
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const { apiEndpoint, messages } = optRef.current;
    const currentIds = selectedIdsRef.current;
    if (currentIds.size === 0) return;
    setDeleting(true);
    setSelectedIds(new Set());
    try {
      const results = await Promise.allSettled(
        Array.from(currentIds).map((id) =>
          fetchWithToast(apiEndpoint, {
            method: 'DELETE',
            body: { id },
            silent: true,
          })
        )
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      setItems((prev) => prev.filter((v) => !currentIds.has(v.id)));
      toast.success(messages.bulkSuccess(successCount));
    } catch {
      toast.error(messages.bulkError);
    } finally {
      setDeleting(false);
    }
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const currentItems = itemsRef.current;
    setSelectedIds((currentIds) => {
      if (currentIds.size === currentItems.length) return new Set();
      return new Set(currentItems.map((v) => v.id));
    });
  }, []);

  return useMemo(() => ({
    items,
    setItems: setItems as Dispatch<SetStateAction<T[]>>,
    selectedIds,
    setSelectedIds,
    deleting,
    handleDeleteOne,
    handleBulkDelete,
    toggleSelect,
    toggleSelectAll,
  }), [items, selectedIds, deleting, handleDeleteOne, handleBulkDelete, toggleSelect, toggleSelectAll]);
}
