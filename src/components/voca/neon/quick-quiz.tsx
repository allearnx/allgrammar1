'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, shuffle, blankOutWord } from '@/lib/utils';
import { NeonResultScreen } from './neon-result-screen';
import { ProgressDots } from './progress-dots';
import { VOCA_COLORS, VOCA_STEP_THEMES } from '@/components/voca/voca-brand';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

export interface QuizWrongWord {
  front_text: string;
  back_text: string;
}

interface QuickQuizProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number, wrongWords: QuizWrongWord[]) => void;
}

type QuizType = 'en-to-ko' | 'ko-to-en' | 'fill-blank';

const PASS_THRESHOLD = 80;

interface QuizQuestion {
  type: QuizType;
  prompt: string;
  hint?: string;
  options: string[];
  correctIndex: number;
  front_text: string;
  back_text: string;
}

function pickType(canFillBlank: boolean): QuizType {
  const types: QuizType[] = canFillBlank
    ? ['en-to-ko', 'ko-to-en', 'fill-blank']
    : ['en-to-ko', 'ko-to-en'];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * 예문에 표제어가 "원형 그대로" 들어있을 때만 fill-blank 출제 가능.
 * 어형 변화(advised, froze 등)된 예문에 원형 보기를 내면 문법이 안 맞아
 * 학생이 헷갈린다 → 그 단어는 뜻 고르기/단어 고르기로 폴백.
 */
function canUseFillBlank(v: VocaVocabulary): boolean {
  if (!v.example_sentence) return false;
  const escaped = v.front_text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(v.example_sentence);
}

function generateQuestions(vocabulary: VocaVocabulary[]): QuizQuestion[] {
  return shuffle([...vocabulary]).map((v) => {
    const type = pickType(canUseFillBlank(v));

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
        front_text: v.front_text,
        back_text: v.back_text,
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
        front_text: v.front_text,
        back_text: v.back_text,
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
      front_text: v.front_text,
      back_text: v.back_text,
    };
  });
}

export function QuickQuiz({ vocabulary, onComplete }: QuickQuizProps) {
  // ⚠️ useMemo([vocabulary])로 만들면 리렌더로 배열 참조가 바뀔 때 퀴즈 도중
  // 문제 전체가 재생성된다(나온 단어 반복 + 안 나온 단어 누락). 마운트 시 1회만 생성.
  const [questions, setQuestions] = useState(() => generateQuestions(vocabulary));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongWordsRef = useRef<QuizWrongWord[]>([]);

  const question = questions[currentIndex];

  const handleSelect = useCallback((optionIndex: number) => {
    if (answered) return;
    setSelectedIndex(optionIndex);
    setAnswered(true);

    const isCorrect = optionIndex === question.correctIndex;
    if (isCorrect) {
      setCorrect((c) => c + 1);
    } else {
      wrongWordsRef.current.push({ front_text: question.front_text, back_text: question.back_text });
    }

    timerRef.current = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
        setSelectedIndex(null);
        setAnswered(false);
      } else {
        const score = Math.round(((correct + (isCorrect ? 1 : 0)) / questions.length) * 100);
        setFinalScore(score);
        // 통과 시엔 "다음 단계로" 클릭을 기다린 뒤 onComplete 호출.
        // 미달이면 기존처럼 즉시 저장 + 부모의 재도전 안내 토스트가 뜨도록 바로 호출.
        if (score < PASS_THRESHOLD) onComplete(score, wrongWordsRef.current);
      }
    }, 800);
  }, [answered, question, currentIndex, questions.length, correct, onComplete]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function handleRetry() {
    setQuestions(generateQuestions(vocabulary));
    setCurrentIndex(0);
    setSelectedIndex(null);
    setCorrect(0);
    setFinalScore(null);
    setAnswered(false);
    wrongWordsRef.current = [];
  }

  if (finalScore !== null) {
    return (
      <NeonResultScreen
        score={finalScore}
        passThreshold={PASS_THRESHOLD}
        passMessage="퀴즈 통과!"
        failMessage="80% 이상 필요합니다"
        subtitle={`${correct}/${questions.length} 정답`}
        onRetry={handleRetry}
        onContinue={finalScore >= PASS_THRESHOLD ? () => onComplete(finalScore, wrongWordsRef.current) : undefined}
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
              <p className="voca-display text-xs text-center mb-1" style={{ color: VOCA_COLORS.blue, fontWeight: 700 }}>빈칸에 들어갈 단어는?</p>
            )}
            <p
              className={cn(
                'voca-display text-center',
                question.type === 'fill-blank' ? 'text-xl md:text-2xl leading-relaxed' : 'text-4xl',
              )}
              style={{ color: question.type === 'fill-blank' ? VOCA_COLORS.ink : VOCA_COLORS.blue, fontWeight: 700, wordBreak: 'keep-all' }}
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

                const theme = VOCA_STEP_THEMES[i % VOCA_STEP_THEMES.length];
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    className={cn(
                      'flex w-full items-center gap-3 py-3.5 px-4 rounded-2xl border-2 text-left text-lg font-medium transition-all',
                      !answered && 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 active:scale-[0.99]',
                      showCorrect && 'border-green-500 bg-green-50 text-green-700',
                      showWrong && 'border-red-500 bg-red-50 text-red-600 wrong-shake',
                      answered && !showCorrect && !showWrong && 'border-gray-100 text-gray-300',
                    )}
                  >
                    <span
                      className="voca-display flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                      style={
                        answered && !showCorrect && !showWrong
                          ? { background: '#F1F3F4', color: '#BDC1C6', fontWeight: 700 }
                          : { background: theme.bg, color: theme.text, fontWeight: 700 }
                      }
                    >
                      {i + 1}
                    </span>
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
