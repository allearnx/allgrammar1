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
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speechTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Refs for stable RAF callback (no stale closure)
  const wordTimestampsRef = useRef(wordTimestamps);
  const currentWordIndexRef = useRef(-1);
  const onWordHighlightRef = useRef(onWordHighlight);
  const onEndRef = useRef(onEnd);
  const updateHighlightRef = useRef<() => void>(() => {});

  // Sync refs after render
  useEffect(() => {
    wordTimestampsRef.current = wordTimestamps;
    onWordHighlightRef.current = onWordHighlight;
    onEndRef.current = onEnd;
    updateHighlightRef.current = () => {
      if (!audioRef.current || !wordTimestampsRef.current) return;
      const currentTime = audioRef.current.currentTime;
      let idx = -1;
      for (let i = 0; i < wordTimestampsRef.current.length; i++) {
        if (currentTime >= wordTimestampsRef.current[i].start && currentTime <= wordTimestampsRef.current[i].end) {
          idx = i;
          break;
        }
      }
      if (idx !== currentWordIndexRef.current) {
        currentWordIndexRef.current = idx;
        setCurrentWordIndex(idx);
        if (idx >= 0) onWordHighlightRef.current?.(idx);
      }
      if (audioRef.current && !audioRef.current.paused) {
        rafRef.current = requestAnimationFrame(() => updateHighlightRef.current());
      }
    };
  });

  const updateHighlight = useCallback(() => updateHighlightRef.current(), []);

  // audioUrl 변경 시 상태 리셋 (React 권장 패턴: render 중 파생 상태 조정)
  const [prevAudioUrl, setPrevAudioUrl] = useState(audioUrl);
  if (prevAudioUrl !== audioUrl) {
    setPrevAudioUrl(audioUrl);
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  }

  // audioUrl 변경 시 기존 Audio/RAF 정리
  useEffect(() => {
    currentWordIndexRef.current = -1;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [audioUrl]);

  const clearSpeechTimers = useCallback(() => {
    speechTimersRef.current.forEach(clearTimeout);
    speechTimersRef.current = [];
  }, []);

  const play = useCallback(async (text?: string) => {
    // ElevenLabs 오디오
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentWordIndex(-1);
          currentWordIndexRef.current = -1;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          onEndRef.current?.();
        };
        audioRef.current.onerror = () => {
          setIsPlaying(false);
          setCurrentWordIndex(-1);
          currentWordIndexRef.current = -1;
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
        onEndRef.current?.();
      };
      utterance.onerror = () => setIsPlaying(false);
      setIsPlaying(true);

      // 단어별 타이밍 추정
      clearSpeechTimers();
      const words = text.split(/\s+/);
      const avgDuration = (text.length * 0.06) / words.length;
      words.forEach((_, i) => {
        const timer = setTimeout(() => {
          currentWordIndexRef.current = i;
          setCurrentWordIndex(i);
          onWordHighlightRef.current?.(i);
        }, i * avgDuration * 1000);
        speechTimersRef.current.push(timer);
      });
      const endTimer = setTimeout(() => {
        currentWordIndexRef.current = -1;
        setCurrentWordIndex(-1);
      }, words.length * avgDuration * 1000);
      speechTimersRef.current.push(endTimer);

      synthRef.current.speak(utterance);
    }
  }, [audioUrl, updateHighlight, clearSpeechTimers]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    clearSpeechTimers();
    setIsPlaying(false);
    setCurrentWordIndex(-1);
    currentWordIndexRef.current = -1;
  }, [clearSpeechTimers]);

  // Cleanup on unmount
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
