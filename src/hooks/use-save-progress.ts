'use client';

import { useCallback } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export function useSaveProgress() {
  const saveTextbookProgress = useCallback(async (passageId: string, type: string, score: number) => {
    try {
      await fetchWithToast('/api/textbook/progress', {
        body: { passageId, type, score },
        silent: true,
      });
    } catch { /* swallow */ }
  }, []);

  return { saveTextbookProgress };
}
