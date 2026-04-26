'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { WordTimestamp } from '@/types/voca';

interface UseAudioPlayerOptions {
  audioUrl: string | null;
  wordTimestamps: WordTimestamp[] | null;
  onWordHighlight?: (index: number) => void;
  onEnd?: () => void;
}

export function useAudioPlayer({
  audioUrl,
  wordTimestamps,
  onWordHighlight,
  onEnd,
}: UseAudioPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  // Web Speech API 폴백
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // 하이라이트 추적
  const updateHighlight = useCallback(() => {
    if (!audioRef.current || !wordTimestamps) return;
    const currentTime = audioRef.current.currentTime;
    let idx = -1;
    for (let i = 0; i < wordTimestamps.length; i++) {
      if (currentTime >= wordTimestamps[i].start && currentTime <= wordTimestamps[i].end) {
        idx = i;
        break;
      }
    }
    if (idx !== currentWordIndex) {
      setCurrentWordIndex(idx);
      if (idx >= 0) onWordHighlight?.(idx);
    }
    if (audioRef.current && !audioRef.current.paused) {
      rafRef.current = requestAnimationFrame(updateHighlight);
    }
  }, [wordTimestamps, currentWordIndex, onWordHighlight]);

  const play = useCallback(async (text?: string) => {
    // ElevenLabs 오디오가 있으면 사용
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentWordIndex(-1);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          onEnd?.();
        };
        audioRef.current.onerror = () => {
          setIsPlaying(false);
          setCurrentWordIndex(-1);
        };
      }
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(updateHighlight);
      return;
    }

    // Web Speech API 폴백
    if (text && typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => {
        setIsPlaying(false);
        onEnd?.();
      };
      utterance.onerror = () => setIsPlaying(false);
      setIsPlaying(true);

      // 단어별 타이밍 추정 (Web Speech API는 타임스탬프 없음)
      if (text) {
        const words = text.split(/\s+/);
        const avgDuration = (text.length * 0.06) / words.length;
        words.forEach((_, i) => {
          setTimeout(() => {
            setCurrentWordIndex(i);
            onWordHighlight?.(i);
          }, i * avgDuration * 1000);
        });
        setTimeout(() => setCurrentWordIndex(-1), words.length * avgDuration * 1000);
      }

      synthRef.current.speak(utterance);
      return;
    }

    // 어떤 TTS도 불가 → 아무것도 하지 않음
  }, [audioUrl, updateHighlight, onEnd, onWordHighlight]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stop();
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
    };
  }, [stop]);

  const hasTts = !!audioUrl || (typeof window !== 'undefined' && !!window.speechSynthesis);

  return { play, stop, isPlaying, currentWordIndex, hasTts };
}
