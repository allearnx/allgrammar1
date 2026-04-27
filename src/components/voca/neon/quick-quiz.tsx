'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, shuffle } from '@/lib/utils';
import { NeonResultScreen } from './neon-result-screen';
import { ProgressDots } from './progress-dots';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

interface QuickQuizProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number) => void;
}

interface QuizQuestion {
  word: string;
  options: string[];
  correctIndex: number;
}

function generateQuestions(vocabulary: VocaVocabulary[]): QuizQuestion[] {
  return shuffle([...vocabulary]).map((v) => {
    const distractors = shuffle(
      vocabulary.filter((d) => d.id !== v.id).map((d) => d.back_text)
    ).slice(0, 3);
    const options = shuffle([v.back_text, ...distractors]);
    return {
      word: v.front_text,
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
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = questions[currentIndex];

  const handleSelect = useCallback((optionIndex: number) => {
    if (answered) return;
    setSelectedIndex(optionIndex);
    setAnswered(true);

    const isCorrect = optionIndex === question.correctIndex;
    if (isCorrect) setCorrect((c) => c + 1);

    timerRef.current = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
        setSelectedIndex(null);
        setAnswered(false);
      } else {
        const score = Math.round(((correct + (isCorrect ? 1 : 0)) / questions.length) * 100);
        setFinalScore(score);
        onComplete(score);
      }
    }, 800);
  }, [answered, question, currentIndex, questions.length, correct, onComplete]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (finalScore !== null) {
    return (
      <NeonResultScreen
        score={finalScore}
        passThreshold={80}
        passMessage="퀴즈 통과!"
        failMessage="80% 이상 필요합니다"
        subtitle={`${correct}/${questions.length} 정답`}
      />
    );
  }

  return (
    <div className="neon-container p-4 md:p-6 min-h-[60dvh] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {questions.length}
        </span>
        <ProgressDots total={questions.length} current={currentIndex} />
      </div>

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
