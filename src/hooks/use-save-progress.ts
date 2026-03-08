'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

export function useSaveProgress() {
  const saveTextbookProgress = useCallback(async (passageId: string, type: string, score: number) => {
    try {
      await fetch('/api/textbook/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passageId, type, score }),
      });
    } catch (err) {
      console.error(err);
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }, []);

  return { saveTextbookProgress };
}
