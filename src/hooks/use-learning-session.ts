'use client';

import { useEffect, useRef } from 'react';

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

export function useLearningSession(
  contextType: 'naesin' | 'voca',
  contextId: string
) {
  const lastTickRef = useRef(Date.now());
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!contextId) return;

    lastTickRef.current = Date.now();
    accumulatedRef.current = 0;
    let paused = false;

    function getElapsedAndReset(): number {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      return elapsed;
    }

    function sendHeartbeat(seconds: number) {
      if (seconds < 1) return;
      const capped = Math.min(seconds, 120);
      const payload = JSON.stringify({ contextType, contextId, seconds: capped });
      fetch('/api/learning/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }

    function sendBeaconHeartbeat(seconds: number) {
      if (seconds < 1) return;
      const capped = Math.min(seconds, 120);
      const payload = JSON.stringify({ contextType, contextId, seconds: capped });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/learning/session',
          new Blob([payload], { type: 'text/plain' })
        );
      } else {
        sendHeartbeat(capped);
      }
    }

    // Heartbeat interval
    const timer = setInterval(() => {
      if (paused) return;
      const elapsed = getElapsedAndReset();
      accumulatedRef.current += elapsed;
      if (accumulatedRef.current >= 1) {
        sendHeartbeat(accumulatedRef.current);
        accumulatedRef.current = 0;
      }
    }, HEARTBEAT_INTERVAL);

    // Visibility change: pause/resume
    function handleVisibility() {
      if (document.hidden) {
        // Going hidden: accumulate remaining time
        const elapsed = getElapsedAndReset();
        accumulatedRef.current += elapsed;
        paused = true;
      } else {
        // Becoming visible: reset tick
        lastTickRef.current = Date.now();
        paused = false;
      }
    }

    // beforeunload: flush remaining time
    function handleBeforeUnload() {
      const elapsed = getElapsedAndReset();
      accumulatedRef.current += elapsed;
      if (accumulatedRef.current >= 1) {
        sendBeaconHeartbeat(accumulatedRef.current);
        accumulatedRef.current = 0;
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Flush on unmount
      const elapsed = getElapsedAndReset();
      accumulatedRef.current += elapsed;
      if (accumulatedRef.current >= 1) {
        sendBeaconHeartbeat(accumulatedRef.current);
        accumulatedRef.current = 0;
      }
    };
  }, [contextType, contextId]);
}
