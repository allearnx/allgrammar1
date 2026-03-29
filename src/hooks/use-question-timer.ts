'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useQuestionTimer(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0 && !isExpired) {
          setIsExpired(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isExpired]);

  const reset = useCallback((newSeconds?: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(newSeconds ?? initialSeconds);
    setIsExpired(false);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsExpired(true);
        }
        return next;
      });
    }, 1000);
  }, [initialSeconds]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { remaining, isExpired, reset, pause };
}
