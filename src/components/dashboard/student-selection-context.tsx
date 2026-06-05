'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface StudentSelectionCtx {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  hasSelection: boolean;
  selectedCount: number;
  allStudentIds: string[];
}

const Ctx = createContext<StudentSelectionCtx | null>(null);

export function StudentSelectionProvider({
  allStudentIds,
  children,
}: {
  allStudentIds: string[];
  children: ReactNode;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allStudentIds));
  }, [allStudentIds]);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return (
    <Ctx.Provider
      value={{
        selectedIds,
        isSelected: (id) => selectedIds.has(id),
        toggle,
        selectAll,
        clearAll,
        hasSelection: selectedIds.size > 0,
        selectedCount: selectedIds.size,
        allStudentIds,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStudentSelection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStudentSelection must be used within StudentSelectionProvider');
  return ctx;
}
