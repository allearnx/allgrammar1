'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, shuffle, blankOutWord } from '@/lib/utils';
import { NeonResultScreen } from './neon-result-screen';
import { ProgressDots } from './progress-dots';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

interface QuickQuizProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number) => void;
}

type QuizType = 'en-to-ko' | 'ko-to-en' | 'fill-blank';

interface QuizQuestion {
  type: QuizType;
  prompt: string;
  hint?: string;
  options: string[];
  correctIndex: number;
}

function pickType(hasExample: boolean): QuizType {
  const types: QuizType[] = hasExample
    ? ['en-to-ko', 'ko-to-en', 'fill-blank']
    : ['en-to-ko', 'ko-to-en'];
  return types[Math.floor(Math.random() * types.length)];
}

function generateQuestions(vocabulary: VocaVocabulary[]): QuizQuestion[] {
  return shuffle([...vocabulary]).map((v) => {
    const type = pickType(!!v.example_sentence);

    if (type === 'ko-to-en') {
      const distractors = shuffle(
        vocabulary.filter((d) => d.id !== v.id).map((d) => d.front_text)
      ).slice(0, 3);
      const options = shuffle([v.front_text, ...distractors]);
      return {
        type,
        prompt: v.back_text,
        options,
        correctIndex: options.indexOf(v.front_text),
      };
    }

    if (type === 'fill-blank') {
      const blanked = blankOutWord(v.example_sentence!, v.front_text);
      const distractors = shuffle(
        vocabulary.filter((d) => d.id !== v.id).map((d) => d.front_text)
      ).slice(0, 3);
      const options = shuffle([v.front_text, ...distractors]);
      return {
        type,
        prompt: blanked,
        hint: v.example_sentence_ko ?? undefined,
        options,
        correctIndex: options.indexOf(v.front_text),
      };
    }

    // en-to-ko (기존)
    const distractors = shuffle(
      vocabulary.filter((d) => d.id !== v.id).map((d) => d.back_text)
    ).slice(0, 3);
    const options = shuffle([v.back_text, ...distractors]);
    return {
      type,
      prompt: v.front_text,
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
        <span className="text-sm text-gray-400">
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
            {question.type === 'fill-blank' && (
              <p className="text-xs font-medium text-center text-indigo-400 mb-1">빈칸에 들어갈 단어는?</p>
            )}
            <p
              className={cn(
                'font-bold text-center neon-text-gold',
                question.type === 'fill-blank' ? 'text-xl md:text-2xl leading-relaxed' : 'text-4xl',
              )}
            >
              {question.prompt}
            </p>
            {question.hint && (
              <p className="text-sm text-center text-gray-400">{question.hint}</p>
            )}

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
                      'w-full py-4 px-5 rounded-xl border-2 text-left text-lg font-medium transition-all',
                      !answered && 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 active:bg-indigo-50',
                      showCorrect && 'border-green-500 bg-green-50 text-green-700',
                      showWrong && 'border-red-500 bg-red-50 text-red-600 wrong-shake',
                      answered && !showCorrect && !showWrong && 'border-gray-100 text-gray-300',
                    )}
                  >
                    <span className="mr-3 text-sm opacity-40">{i + 1}</span>
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
