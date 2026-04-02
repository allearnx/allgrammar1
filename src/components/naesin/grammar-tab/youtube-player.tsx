'use client';

import { useEffect, useRef, useCallback } from 'react';
import { loadYouTubeAPI } from '@/lib/youtube/player-api';
import type { NaesinGrammarVideoProgress } from '@/types/database';

const SAVE_INTERVAL_MS = 30000; // 30 seconds
const COMPLETION_THRESHOLD = 80;

export function NaesinYouTubePlayerTracked({
  videoId,
  lessonId,
  unitId,
  onVideoProgress,
  initialProgress,
  progressEndpoint = '/api/naesin/grammar/video-progress',
}: {
  videoId: string;
  lessonId: string;
  unitId: string;
  onVideoProgress: (percent: number, completed: boolean) => void;
  initialProgress?: NaesinGrammarVideoProgress;
  progressEndpoint?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxPositionRef = useRef(initialProgress?.max_position_reached ?? 0);
  const cumulativeRef = useRef(initialProgress?.cumulative_watch_seconds ?? 0);
  const lastTickRef = useRef<number | null>(null);
  const completedRef = useRef(initialProgress?.completed ?? false);
  const elementId = `naesin-yt-${lessonId}`;

  const saveProgress = useCallback(
    (position: number, duration: number) => {
      if (completedRef.current) return;

      const body = JSON.stringify({
        lessonId,
        unitId,
        position,
        duration,
        cumulativeSeconds: cumulativeRef.current,
      });

      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(progressEndpoint, body);
      } else {
        fetch(progressEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }

      // Update percent locally
      if (duration > 0) {
        const percent = Math.min(100, Math.round((maxPositionRef.current / duration) * 100));
        const completed = percent >= COMPLETION_THRESHOLD;
        if (completed) completedRef.current = true;
        onVideoProgress(percent, completed);
      }
    },
    [lessonId, unitId, onVideoProgress, progressEndpoint]
  );

  useEffect(() => {
    let mounted = true;

    async function init() {
      await loadYouTubeAPI();
      if (!mounted || !containerRef.current) return;

      playerRef.current = new YT.Player(elementId, {
        videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0,
          // @ts-expect-error - 'start' is valid YouTube player param
          ...(initialProgress?.last_position > 0 ? { start: Math.floor(initialProgress.last_position) } : {}),
        },
        events: {
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (!mounted) return;

            if (event.data === YT.PlayerState.PLAYING) {
              lastTickRef.current = Date.now();
              if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                  if (playerRef.current) {
                    const now = Date.now();
                    if (lastTickRef.current) {
                      cumulativeRef.current += (now - lastTickRef.current) / 1000;
                    }
                    lastTickRef.current = now;

                    const currentTime = playerRef.current.getCurrentTime();
                    maxPositionRef.current = Math.max(maxPositionRef.current, currentTime);
                    const duration = playerRef.current.getDuration();
                    saveProgress(maxPositionRef.current, duration);
                  }
                }, SAVE_INTERVAL_MS);
              }
            } else if (event.data === YT.PlayerState.PAUSED) {
              if (lastTickRef.current) {
                cumulativeRef.current += (Date.now() - lastTickRef.current) / 1000;
                lastTickRef.current = null;
              }
              if (playerRef.current) {
                const currentTime = playerRef.current.getCurrentTime();
                maxPositionRef.current = Math.max(maxPositionRef.current, currentTime);
                saveProgress(maxPositionRef.current, playerRef.current.getDuration());
              }
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            } else if (event.data === YT.PlayerState.ENDED) {
              if (lastTickRef.current) {
                cumulativeRef.current += (Date.now() - lastTickRef.current) / 1000;
                lastTickRef.current = null;
              }
              if (playerRef.current) {
                const duration = playerRef.current.getDuration();
                maxPositionRef.current = duration;
                saveProgress(duration, duration);
              }
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          },
        },
      });
    }

    init();

    function handleVisibilityChange() {
      if (document.hidden && playerRef.current) {
        if (lastTickRef.current) {
          cumulativeRef.current += (Date.now() - lastTickRef.current) / 1000;
          lastTickRef.current = null;
        }
        const currentTime = playerRef.current.getCurrentTime();
        maxPositionRef.current = Math.max(maxPositionRef.current, currentTime);
        saveProgress(maxPositionRef.current, playerRef.current.getDuration());
      }
    }

    function handleBeforeUnload() {
      if (playerRef.current) {
        if (lastTickRef.current) {
          cumulativeRef.current += (Date.now() - lastTickRef.current) / 1000;
        }
        const body = JSON.stringify({
          lessonId,
          unitId,
          position: maxPositionRef.current,
          duration: playerRef.current.getDuration(),
          cumulativeSeconds: cumulativeRef.current,
        });
        navigator.sendBeacon(progressEndpoint, body);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current) playerRef.current.destroy();
    };
  }, [videoId, lessonId, unitId, elementId, saveProgress, initialProgress, progressEndpoint]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} id={elementId} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
