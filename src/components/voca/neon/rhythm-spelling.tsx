'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Volume2, Delete, CornerDownLeft } from 'lucide-react';
import { useAudioPlayer } from './audio-player-hook';
import './neon-styles.css';

const QWERTY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

interface RhythmSpellingProps {
  vocabulary: { id: string; front_text: string; back_text: string; example_sentence: string | null; audio_url: string | null; word_timestamps: import('@/types/voca').WordTimestamp[] | null }[];
  onComplete: (score: number) => void;
}

interface WordResult {
  word: string;
  firstTryCorrect: number;
  totalLetters: number;
}

export function RhythmSpelling({ vocabulary, onComplete }: RhythmSpellingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [letterStates, setLetterStates] = useState<('pending' | 'correct' | 'wrong')[]>([]);
  const [results, setResults] = useState<WordResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const vocab = vocabulary[currentIndex];
  const targetWord = vocab.front_text.toLowerCase();
  const currentLetterIdx = typedLetters.length;

  const { play, isPlaying } = useAudioPlayer({
    audioUrl: vocab.audio_url,
    wordTimestamps: vocab.word_timestamps,
  });

  // 문장에서 단어를 빈칸 처리
  const sentenceWithBlank = vocab.example_sentence
    ? vocab.example_sentence.replace(
        new RegExp(`\\b${vocab.front_text}\\b`, 'i'),
        '_'.repeat(vocab.front_text.length)
      )
    : null;

  // 첫 시도 정답 추적
  const wrongLettersRef = useRef<Set<number>>(new Set());

  const handleKeyPress = useCallback((key: string) => {
    if (currentLetterIdx >= targetWord.length) return;

    const expected = targetWord[currentLetterIdx];
    const isCorrect = key.toLowerCase() === expected;

    if (isCorrect) {
      setTypedLetters((prev) => [...prev, key.toLowerCase()]);
      setLetterStates((prev) => [...prev, 'correct']);

      // 마지막 글자 완성
      if (currentLetterIdx + 1 === targetWord.length) {
        const firstTryCorrect = targetWord.length - wrongLettersRef.current.size;
        const result: WordResult = {
          word: vocab.front_text,
          firstTryCorrect,
          totalLetters: targetWord.length,
        };
        setResults((prev) => [...prev, result]);

        // 다음 단어 또는 완료
        setTimeout(() => {
          if (currentIndex + 1 < vocabulary.length) {
            setCurrentIndex((prev) => prev + 1);
            setTypedLetters([]);
            setLetterStates([]);
            wrongLettersRef.current = new Set();
          } else {
            const allResults = [...results, result];
            const totalCorrect = allResults.reduce((s, r) => s + r.firstTryCorrect, 0);
            const totalLetters = allResults.reduce((s, r) => s + r.totalLetters, 0);
            const score = Math.round((totalCorrect / totalLetters) * 100);
            setShowResult(true);
            onComplete(score);
          }
        }, 600);
      }
    } else {
      wrongLettersRef.current.add(currentLetterIdx);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 400);
    }
  }, [currentLetterIdx, targetWord, currentIndex, vocabulary.length, vocab.front_text, results, onComplete]);

  // 물리 키보드 지원
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showResult) return;
      if (e.key === 'Backspace') {
        // 백스페이스는 무시 (틀린 글자를 지울 수 없음)
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyPress, showResult]);

  // 포커스 유지 (모바일에서도 키보드 이벤트 받기 위해)
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  if (showResult) {
    const totalCorrect = results.reduce((s, r) => s + r.firstTryCorrect, 0);
    const totalLetters = results.reduce((s, r) => s + r.totalLetters, 0);
    const score = Math.round((totalCorrect / totalLetters) * 100);
    return (
      <div className="neon-container p-6 min-h-[60dvh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <p className={cn('text-5xl font-bold', score >= 80 ? 'neon-text-green' : 'neon-text-gold')}>
            {score}%
          </p>
          <p className="text-slate-400">
            {score >= 80 ? '통과!' : '80% 이상 필요합니다'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="neon-container p-4 md:p-6 min-h-[60dvh] flex flex-col">
      {/* Hidden input for mobile keyboard fallback */}
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        inputMode="none"
      />

      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {vocabulary.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400"
          onClick={() => play(vocab.example_sentence || vocab.front_text)}
          disabled={isPlaying}
        >
          <Volume2 className={cn('h-4 w-4', isPlaying && 'animate-pulse text-cyan-400')} />
        </Button>
      </div>

      {/* Sentence with blank */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 flex flex-col items-center justify-center space-y-6"
        >
          {sentenceWithBlank && (
            <p className="text-lg text-slate-400 text-center px-4">
              {sentenceWithBlank}
            </p>
          )}

          {/* 뜻 */}
          <p className="text-base text-slate-500">{vocab.back_text}</p>

          {/* Letter slots */}
          <div className={cn('flex gap-1.5 justify-center flex-wrap', wrongFlash && 'wrong-shake')}>
            {targetWord.split('').map((letter, i) => {
              const state = letterStates[i];
              const isNext = i === currentLetterIdx;

              return (
                <div
                  key={i}
                  className={cn(
                    'w-9 h-12 md:w-11 md:h-14 rounded-lg border-2 flex items-center justify-center text-lg md:text-xl font-bold transition-all',
                    state === 'correct' && 'border-green-500 text-green-400 bg-green-500/10 correct-flash',
                    state === 'wrong' && 'border-red-500 text-red-400 bg-red-500/10',
                    !state && isNext && 'border-cyan-400 guide-glow',
                    !state && !isNext && 'border-slate-700 text-slate-700',
                  )}
                >
                  {state === 'correct' ? typedLetters[i] : isNext ? '_' : ''}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* QWERTY Keyboard */}
      <div className="mt-auto pt-4 space-y-1.5">
        {QWERTY_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {ri === 2 && <div className="w-6" />} {/* spacer for bottom row */}
            {row.map((key) => (
              <button
                key={key}
                className="neon-key flex-1 max-w-[2.5rem]"
                onClick={() => handleKeyPress(key)}
              >
                {key}
              </button>
            ))}
            {ri === 2 && (
              <button
                className="neon-key w-12 flex-none"
                onClick={() => {/* backspace disabled by design */}}
              >
                <Delete className="h-4 w-4 opacity-30" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
