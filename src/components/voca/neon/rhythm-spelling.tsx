'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Volume2, Delete } from 'lucide-react';
import { useAudioPlayer } from './audio-player-hook';
import { NeonResultScreen } from './neon-result-screen';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

const QWERTY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface RhythmSpellingProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number) => void;
}

interface WordResult {
  firstTryCorrect: number;
  totalLetters: number;
}

export function RhythmSpelling({ vocabulary, onComplete }: RhythmSpellingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [letterStates, setLetterStates] = useState<('correct' | 'wrong')[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<WordResult[]>([]);
  const wrongLettersRef = useRef<Set<number>>(new Set());

  const vocab = vocabulary[currentIndex];
  const targetWord = vocab.front_text.trim().toLowerCase();
  const currentLetterIdx = typedLetters.length;

  const { play, isPlaying } = useAudioPlayer({
    audioUrl: vocab.audio_url,
    wordTimestamps: vocab.word_timestamps,
  });

  const trimmedFront = vocab.front_text.trim();
  const sentenceWithBlank = vocab.example_sentence
    ? vocab.example_sentence.replace(
        new RegExp(`\\b${escapeRegex(trimmedFront)}\\b`, 'i'),
        '_'.repeat(trimmedFront.length)
      )
    : null;

  const handleKeyPress = useCallback((key: string) => {
    if (currentLetterIdx >= targetWord.length) return;

    const isCorrect = key.toLowerCase() === targetWord[currentLetterIdx];

    if (isCorrect) {
      setTypedLetters((prev) => [...prev, key.toLowerCase()]);
      setLetterStates((prev) => [...prev, 'correct']);

      if (currentLetterIdx + 1 === targetWord.length) {
        resultsRef.current.push({
          firstTryCorrect: targetWord.length - wrongLettersRef.current.size,
          totalLetters: targetWord.length,
        });

        advanceTimerRef.current = setTimeout(() => {
          if (currentIndex + 1 < vocabulary.length) {
            setCurrentIndex((prev) => prev + 1);
            setTypedLetters([]);
            setLetterStates([]);
            wrongLettersRef.current = new Set();
          } else {
            const all = resultsRef.current;
            const totalCorrect = all.reduce((s, r) => s + r.firstTryCorrect, 0);
            const totalLetters = all.reduce((s, r) => s + r.totalLetters, 0);
            const score = Math.round((totalCorrect / totalLetters) * 100);
            setFinalScore(score);
            onComplete(score);
          }
        }, 600);
      }
    } else {
      wrongLettersRef.current.add(currentLetterIdx);
      setWrongFlash(true);
      flashTimerRef.current = setTimeout(() => setWrongFlash(false), 400);
    }
  }, [currentLetterIdx, targetWord, currentIndex, vocabulary.length, onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finalScore !== null || e.key === 'Backspace') return;
      if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyPress, finalScore]);

  useEffect(() => { inputRef.current?.focus(); }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  if (finalScore !== null) {
    return (
      <NeonResultScreen
        score={finalScore}
        passThreshold={80}
        passMessage="통과!"
        failMessage="80% 이상 필요합니다"
      />
    );
  }

  return (
    <div className="neon-container p-4 md:p-6 min-h-[60dvh] flex flex-col">
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        inputMode="none"
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {vocabulary.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400"
          onClick={() => play(vocab.example_sentence || vocab.front_text)}
          disabled={isPlaying}
        >
          <Volume2 className={cn('h-4 w-4', isPlaying && 'animate-pulse text-indigo-500')} />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 flex flex-col items-center justify-center space-y-6"
        >
          {sentenceWithBlank && (
            <p className="text-xl text-gray-500 text-center px-4">{sentenceWithBlank}</p>
          )}

          <p className="text-lg text-gray-600 font-medium">{vocab.back_text}</p>

          <div className={cn('flex gap-1.5 justify-center flex-wrap', wrongFlash && 'wrong-shake')}>
            {targetWord.split('').map((_, i) => {
              const state = letterStates[i];
              const isNext = i === currentLetterIdx;
              return (
                <div
                  key={i}
                  className={cn(
                    'w-10 h-13 md:w-12 md:h-15 rounded-lg border-2 flex items-center justify-center text-xl md:text-2xl font-bold transition-all',
                    state === 'correct' && 'border-green-500 text-green-600 bg-green-50 correct-flash',
                    !state && isNext && 'border-indigo-400 bg-indigo-50/50 guide-glow',
                    !state && !isNext && 'border-gray-200 text-gray-300',
                  )}
                >
                  {state === 'correct' ? typedLetters[i] : isNext ? '_' : ''}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-auto pt-4 space-y-1.5">
        {QWERTY_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {ri === 2 && <div className="w-6" />}
            {row.map((key) => (
              <button key={key} className="neon-key flex-1 max-w-[2.5rem]" onClick={() => handleKeyPress(key)}>
                {key}
              </button>
            ))}
            {ri === 2 && (
              <button className="neon-key w-12 flex-none" onClick={() => {}}>
                <Delete className="h-4 w-4 opacity-30" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
