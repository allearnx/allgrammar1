'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createYouTubePlayer } from '@/lib/youtube/player-api';

interface YouTubePlayerProps {
  videoId: string;
  grammarId: string;
  initialPosition?: number;
  onProgressUpdate?: (seconds: number) => void;
  onComplete?: () => void;
}

const SAVE_INTERVAL_MS = 30000; // 30 seconds

export function YouTubePlayer({
  videoId,
  grammarId,
  initialPosition = 0,
  onProgressUpdate,
  onComplete,
}: YouTubePlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef(0);

  const saveProgress = useCallback(
    async (seconds: number, completed: boolean = false) => {
      if (seconds === lastSavedRef.current && !completed) return;
      lastSavedRef.current = seconds;

      const body = JSON.stringify({
        grammarId,
        position: Math.floor(seconds),
        completed,
      });

      // Try sendBeacon first (works during page unload), fallback to fetch
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/api/video-progress', body);
      } else {
        fetch('/api/video-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }

      onProgressUpdate?.(seconds);
    },
    [grammarId, onProgressUpdate]
  );

  useEffect(() => {
    let mounted = true;

    async function init() {
      const player = await createYouTubePlayer({
        videoId,
        elementId: 'yt-player',
        onReady: (p) => {
          if (!mounted) return;
          playerRef.current = p;
          if (initialPosition > 0) {
            p.seekTo(initialPosition, true);
          }
        },
        onStateChange: (event) => {
          if (!mounted) return;
          const state = event.data;

          if (state === YT.PlayerState.PLAYING) {
            // Start interval tracking
            if (!intervalRef.current) {
              intervalRef.current = setInterval(() => {
                if (playerRef.current) {
                  const currentTime = playerRef.current.getCurrentTime();
                  saveProgress(currentTime);
                }
              }, SAVE_INTERVAL_MS);
            }
          } else if (state === YT.PlayerState.PAUSED) {
            // Save on pause
            if (playerRef.current) {
              saveProgress(playerRef.current.getCurrentTime());
            }
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          } else if (state === YT.PlayerState.ENDED) {
            // Save completion
            if (playerRef.current) {
              saveProgress(playerRef.current.getDuration(), true);
              onComplete?.();
            }
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        },
      });
    }

    init();

    // Save on visibility change
    function handleVisibilityChange() {
      if (document.hidden && playerRef.current) {
        saveProgress(playerRef.current.getCurrentTime());
      }
    }

    // Save on beforeunload with sendBeacon
    function handleBeforeUnload() {
      if (playerRef.current) {
        const seconds = Math.floor(playerRef.current.getCurrentTime());
        const body = JSON.stringify({
          grammarId,
          position: seconds,
          completed: false,
        });
        navigator.sendBeacon('/api/video-progress', body);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, grammarId, initialPosition, saveProgress, onComplete]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div id="yt-player" className="absolute inset-0 w-full h-full" />
    </div>
  );
}
