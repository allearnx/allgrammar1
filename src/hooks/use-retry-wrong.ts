'use client';

import { useState, useCallback } from 'react';

interface UseRetryWrongReturn {
  /** Accumulated correct count from previous retry rounds */
  previousCorrectCount: number;
  /** Current retry round (0 = first attempt) */
  retryRound: number;
  /** Whether user is in a retry round */
  isRetrying: boolean;
  /** Call when starting a retry: accumulates currentCorrect from this round */
  startRetry: (currentCorrect: number) => void;
  /** Full reset back to initial state */
  reset: () => void;
  /** Calculate combined percentage score across all retry rounds */
  getCombinedScore: (currentCorrect: number, totalOriginal: number) => number;
}

export function useRetryWrong(): UseRetryWrongReturn {
  const [previousCorrectCount, setPreviousCorrectCount] = useState(0);
  const [retryRound, setRetryRound] = useState(0);

  const isRetrying = retryRound > 0;

  const startRetry = useCallback((currentCorrect: number) => {
    setPreviousCorrectCount((prev) => prev + currentCorrect);
    setRetryRound((prev) => prev + 1);
  }, []);

  const reset = useCallback(() => {
    setPreviousCorrectCount(0);
    setRetryRound(0);
  }, []);

  const getCombinedScore = useCallback(
    (currentCorrect: number, totalOriginal: number) => {
      if (totalOriginal === 0) return 0;
      return Math.round(((previousCorrectCount + currentCorrect) / totalOriginal) * 100);
    },
    [previousCorrectCount],
  );

  return { previousCorrectCount, retryRound, isRetrying, startRetry, reset, getCombinedScore };
}
