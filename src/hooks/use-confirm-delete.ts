'use client';

import { useState } from 'react';

export function useConfirmDelete(onDelete: (id: string) => Promise<void>) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return {
    deleteId,
    requestDelete: (id: string) => setDeleteId(id),
    confirmDialogProps: {
      open: deleteId !== null,
      onOpenChange: (open: boolean) => {
        if (!open) setDeleteId(null);
      },
      onConfirm: () => {
        const id = deleteId;
        setDeleteId(null);
        if (id) onDelete(id);
      },
    },
  };
}
