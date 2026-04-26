'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { shuffle } from '@/lib/utils';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

interface QuickQuizProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number) => void;
}

interface QuizQuestion {
  word: string;
  correctAnswer: string;
  options: string[];
  correctIndex: number;
}

function generateQuestions(vocabulary: VocaVocabulary[]): QuizQuestion[] {
  const all = [...vocabulary];
  return shuffle(all).map((v) => {
    // 오답 풀: 다른 단어의 back_text
    const distractors = shuffle(
      vocabulary
        .filter((d) => d.id !== v.id)
        .map((d) => d.back_text)
    ).slice(0, 3);

    const options = shuffle([v.back_text, ...distractors]);
    return {
      word: v.front_text,
      correctAnswer: v.back_text,
      options,
      correctIndex: options.indexOf(v.back_text),
    };
  });
}

export function QuickQuiz({ vocabulary, onComplete }: QuickQuizProps) {
  const questions = useMemo(() => generateQuestions(vocabulary), [vocabulary]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  const question = questions[currentIndex];

  const handleSelect = useCallback((optionIndex: number) => {
    if (answered) return;
    setSelectedIndex(optionIndex);
    setAnswered(true);

    const isCorrect = optionIndex === question.correctIndex;
    if (isCorrect) setCorrect((c) => c + 1);

    // 0.8초 후 다음
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
        setSelectedIndex(null);
        setAnswered(false);
      } else {
        const finalCorrect = correct + (isCorrect ? 1 : 0);
        const score = Math.round((finalCorrect / questions.length) * 100);
        setShowResult(true);
        onComplete(score);
      }
    }, 800);
  }, [answered, question, currentIndex, questions.length, correct, onComplete]);

  if (showResult) {
    const score = Math.round((correct / questions.length) * 100);
    return (
      <div className="neon-container p-6 min-h-[60dvh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <p className={cn('text-5xl font-bold', score >= 80 ? 'neon-text-green' : 'neon-text-gold')}>
            {score}%
          </p>
          <p className="text-slate-400">
            {correct}/{questions.length} 정답
          </p>
          <p className="text-slate-500 text-sm">
            {score >= 80 ? '퀴즈 통과!' : '80% 이상 필요합니다'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="neon-container p-4 md:p-6 min-h-[60dvh] flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full',
                i === currentIndex ? 'bg-cyan-400' :
                i < currentIndex ? 'bg-slate-500' : 'bg-slate-700',
              )}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md space-y-8"
          >
            <p className="text-3xl font-bold text-center neon-text-gold">
              {question.word}
            </p>

            <div className="space-y-3">
              {question.options.map((option, i) => {
                const isSelected = selectedIndex === i;
                const isCorrectOption = i === question.correctIndex;
                const showCorrect = answered && isCorrectOption;
                const showWrong = answered && isSelected && !isCorrectOption;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    className={cn(
                      'w-full py-3.5 px-4 rounded-xl border-2 text-left text-base font-medium transition-all',
                      !answered && 'border-slate-700 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/5 active:bg-cyan-400/10',
                      showCorrect && 'border-green-500 bg-green-500/10 text-green-400',
                      showWrong && 'border-red-500 bg-red-500/10 text-red-400 wrong-shake',
                      answered && !showCorrect && !showWrong && 'border-slate-800 text-slate-600',
                    )}
                  >
                    <span className="mr-3 text-sm opacity-50">{i + 1}</span>
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
