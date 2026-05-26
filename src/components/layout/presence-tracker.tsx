'use client';

import { useEffect, useRef } from 'react';

const PRESENCE_INTERVAL = 120_000; // 120 seconds

export function PresenceTracker() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function ping() {
      fetch('/api/presence', { method: 'PATCH' }).catch(() => {});
    }

    // Initial ping
    ping();

    function start() {
      if (!timerRef.current) {
        timerRef.current = setInterval(ping, PRESENCE_INTERVAL);
      }
    }

    function stop() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        ping();
        start();
      } else {
        stop();
      }
    }

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
