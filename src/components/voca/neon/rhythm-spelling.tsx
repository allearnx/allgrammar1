'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn, shuffle, blankOutWordExact } from '@/lib/utils';
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

/** 알파벳이 아닌 문자(공백, 하이픈 등)인지 */
function isNonLetter(ch: string) {
  return !/[a-zA-Z]/.test(ch);
}

interface SpellingWrongWord {
  front_text: string;
  back_text: string;
}

interface RhythmSpellingProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number, wrongWords: SpellingWrongWord[]) => void;
}

interface WordResult {
  firstTryCorrect: number;
  totalLetters: number;
}

export function RhythmSpelling({ vocabulary, onComplete }: RhythmSpellingProps) {
  const [attempt, setAttempt] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledVocab = useMemo(() => shuffle([...vocabulary]), [vocabulary, attempt]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [letterStates, setLetterStates] = useState<('correct' | 'wrong' | 'auto')[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<WordResult[]>([]);
  const wrongWordsRef = useRef<SpellingWrongWord[]>([]);
  const wrongLettersRef = useRef<Set<number>>(new Set());

  const vocab = shuffledVocab[currentIndex];
  const targetWord = vocab.front_text.trim().toLowerCase();
  const currentLetterIdx = typedLetters.length;

  // 알파벳 글자만 카운트 (채점용)
  const letterCount = targetWord.split('').filter((ch) => !isNonLetter(ch)).length;

  const { play, isPlaying } = useAudioPlayer({
    audioUrl: vocab.audio_url,
    wordTimestamps: vocab.word_timestamps,
  });

  // 예문은 그대로 보여준다 (froze↔freeze 같은 불규칙 활용형이 예문에 있어도 OK —
  // 답은 표제어로 쓰면 되므로). 표제어가 예문에 있으면 빈칸 처리된다.
  const sentenceWithBlank = vocab.example_sentence
    ? blankOutWordExact(vocab.example_sentence, vocab.front_text)
    : null;

  /** 현재 위치부터 연속된 비알파벳 문자를 자동 채움 */
  const autoFillNonLetters = useCallback((fromIdx: number, letters: string[], states: ('correct' | 'wrong' | 'auto')[]) => {
    let idx = fromIdx;
    const newLetters = [...letters];
    const newStates = [...states];
    while (idx < targetWord.length && isNonLetter(targetWord[idx])) {
      newLetters.push(targetWord[idx]);
      newStates.push('auto');
      idx++;
    }
    return { newLetters, newStates };
  }, [targetWord]);

  const finishWord = useCallback(() => {
    const hadWrong = wrongLettersRef.current.size > 0;
    resultsRef.current.push({
      firstTryCorrect: letterCount - wrongLettersRef.current.size,
      totalLetters: letterCount,
    });
    if (hadWrong) {
      wrongWordsRef.current.push({
        front_text: shuffledVocab[currentIndex].front_text,
        back_text: shuffledVocab[currentIndex].back_text,
      });
    }

    advanceTimerRef.current = setTimeout(() => {
      if (currentIndex + 1 < shuffledVocab.length) {
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
        onComplete(score, wrongWordsRef.current);
      }
    }, 600);
  }, [currentIndex, shuffledVocab, onComplete, letterCount]);

  const handleKeyPress = useCallback((key: string) => {
    if (currentLetterIdx >= targetWord.length) return;

    // 현재 위치가 비알파벳이면 자동 채움 후 진행
    let effectiveIdx = currentLetterIdx;
    let currentTyped = typedLetters;
    let currentStates = letterStates;
    if (isNonLetter(targetWord[effectiveIdx])) {
      const { newLetters, newStates } = autoFillNonLetters(effectiveIdx, [...typedLetters], [...letterStates]);
      currentTyped = newLetters;
      currentStates = newStates;
      effectiveIdx = newLetters.length;
      if (effectiveIdx >= targetWord.length) {
        setTypedLetters(currentTyped);
        setLetterStates(currentStates);
        finishWord();
        return;
      }
    }

    const isCorrect = key.toLowerCase() === targetWord[effectiveIdx];

    if (isCorrect) {
      let newLetters = [...currentTyped, key.toLowerCase()];
      let newStates: ('correct' | 'wrong' | 'auto')[] = [...currentStates, 'correct'];

      // 다음 위치가 비알파벳이면 자동 채움
      const filled = autoFillNonLetters(effectiveIdx + 1, newLetters, newStates);
      newLetters = filled.newLetters;
      newStates = filled.newStates;

      setTypedLetters(newLetters);
      setLetterStates(newStates);

      if (newLetters.length >= targetWord.length) {
        finishWord();
      }
    } else {
      wrongLettersRef.current.add(effectiveIdx);
      setWrongFlash(true);
      flashTimerRef.current = setTimeout(() => setWrongFlash(false), 400);
      // state 업데이트 (자동채움 적용)
      if (currentTyped !== typedLetters) {
        setTypedLetters(currentTyped);
        setLetterStates(currentStates);
      }
    }
  }, [currentLetterIdx, targetWord, typedLetters, letterStates, autoFillNonLetters, finishWord]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finalScore !== null) return;
      if (e.isComposing || e.key === 'Process') return; // 한글 IME 조합 중 무시
      if (e.key === 'Backspace') return;
      // 물리 키(e.code) 기준으로 판정 — 한글 IME가 켜져 있어도 영문 스펠링 입력 가능.
      // (숨은 입력창에 IME 조합이 들어가면 e.key가 자모/'Process'가 되어 안 먹던 문제 해결)
      const codeMatch = /^Key([A-Z])$/.exec(e.code);
      const letter = codeMatch
        ? codeMatch[1].toLowerCase()
        : /^[a-zA-Z]$/.test(e.key)
          ? e.key.toLowerCase()
          : null;
      if (letter) {
        e.preventDefault();
        handleKeyPress(letter);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyPress, finalScore]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  function handleRetry() {
    setAttempt((a) => a + 1);
    setCurrentIndex(0);
    setTypedLetters([]);
    setLetterStates([]);
    setFinalScore(null);
    resultsRef.current = [];
    wrongWordsRef.current = [];
    wrongLettersRef.current = new Set();
  }

  if (finalScore !== null) {
    return (
      <NeonResultScreen
        score={finalScore}
        passThreshold={80}
        passMessage="통과!"
        failMessage="80% 이상 필요합니다"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="neon-container p-4 md:p-6 min-h-[60dvh] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {shuffledVocab.length}
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

      {/* 답 형태 안내 — 예문이 활용형(과거형/복수형 등)일 수 있으므로 */}
      <p className="text-xs text-center text-gray-400 mb-2">
        💡 답은 단어의 <span className="font-medium text-gray-500">기본형</span>으로 쓰세요
      </p>

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
            {targetWord.split('').map((ch, i) => {
              const state = letterStates[i];
              const isNext = i === currentLetterIdx;
              const isSeparator = isNonLetter(ch);

              if (isSeparator) {
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-4 h-13 md:w-5 md:h-15 flex items-center justify-center text-xl text-gray-300',
                      state === 'auto' && 'text-green-400',
                    )}
                  >
                    {ch === ' ' ? '' : ch}
                  </div>
                );
              }

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
