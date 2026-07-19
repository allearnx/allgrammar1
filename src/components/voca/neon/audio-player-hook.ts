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

  /** 텍스트 기반 단어별 추정 타이밍 설정 */
  const setupEstimatedTimers = useCallback((text: string, totalDurationSec: number) => {
    clearSpeechTimers();
    const words = text.split(/\s+/);
    if (words.length === 0) return;
    const perWord = totalDurationSec / words.length;
    words.forEach((_, i) => {
      const timer = setTimeout(() => {
        currentWordIndexRef.current = i;
        setCurrentWordIndex(i);
        onWordHighlightRef.current?.(i);
      }, i * perWord * 1000);
      speechTimersRef.current.push(timer);
    });
  }, [clearSpeechTimers]);

  const play = useCallback(async (text?: string) => {
    // ElevenLabs 오디오
    if (audioUrl) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => {
            setIsPlaying(false);
            setCurrentWordIndex(-1);
            currentWordIndexRef.current = -1;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            clearSpeechTimers();
            onEndRef.current?.();
          };
          audioRef.current.onerror = () => {
            setIsPlaying(false);
            setCurrentWordIndex(-1);
            currentWordIndexRef.current = -1;
            clearSpeechTimers();
            // 로드 실패한 엘리먼트를 재사용하면 이후 클릭도 계속 무음 — 다음 시도에 새로 생성
            audioRef.current = null;
          };
        }
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        setIsPlaying(true);

        if (wordTimestampsRef.current && wordTimestampsRef.current.length > 0) {
          // 정밀 타임스탬프 기반 하이라이트
          rafRef.current = requestAnimationFrame(updateHighlight);
        } else if (text) {
          // 타임스탬프 없음 — 오디오 길이 기반 추정 타이밍
          const dur = audioRef.current.duration;
          const estimatedDur = dur && isFinite(dur) ? dur : text.length * 0.06;
          setupEstimatedTimers(text, estimatedDur);
        }
        return;
      } catch {
        // 오디오 재생 실패 → 깨진 엘리먼트 폐기 후 Web Speech 폴백으로 진행
        audioRef.current = null;
      }
    }

    // Web Speech API 폴백
    if (text && typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      // Chrome: 이전 발화가 큐에 걸려 있으면 새 speak()가 무음이 됨 — 항상 큐 초기화
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      // 영어 보이스가 있으면 명시 지정 — 일부 기기에서 기본 보이스가 무음/한국어인 문제 대응
      const voices = synthRef.current.getVoices();
      const enVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentWordIndex(-1);
        currentWordIndexRef.current = -1;
        clearSpeechTimers();
        onEndRef.current?.();
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentWordIndex(-1);
        currentWordIndexRef.current = -1;
        clearSpeechTimers();
      };
      setIsPlaying(true);

      // 단어별 타이밍 추정
      const estimatedDur = text.length * 0.06;
      setupEstimatedTimers(text, estimatedDur);

      synthRef.current.speak(utterance);
      // iOS 사파리/일부 크롬: paused 상태로 시작해 무음이 되는 버그 — resume은 무해한 no-op
      synthRef.current.resume();
    }
  }, [audioUrl, updateHighlight, clearSpeechTimers, setupEstimatedTimers]);

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
