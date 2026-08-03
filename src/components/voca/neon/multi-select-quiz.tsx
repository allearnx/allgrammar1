'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateMultiSelectQuestions, isExactMatch } from '@/lib/voca/multi-select-quiz';
import { NeonResultScreen } from './neon-result-screen';
import { ProgressDots } from './progress-dots';
import { VOCA_COLORS, VOCA_STEP_THEMES } from '@/components/voca/voca-brand';
import type { VocaVocabulary } from '@/types/voca';
import type { QuizWrongWord } from './quick-quiz';
import './neon-styles.css';

/**
 * 복수 선택 퀴즈 — 초등(주제별) 교재의 4지선다 대체.
 *
 * 뜻 하나 → 해당 단어 "모두" 고르기. 정답 개수는 알려주지 않는다 — 몇 개인지
 * 모르면 보기 하나하나를 O/X 판정해야 해서, 정답이 1개인 문제도 소거법이 안
 * 통한다. 문제 생성 규칙은 lib/voca/multi-select-quiz.ts 참고.
 *
 * onComplete 시그니처를 QuickQuiz와 맞춰 부모(neon/index.tsx)의 게이트
 * (quiz_score>=80 → 스펠링 해제)·진도·오답 저장 경로를 그대로 탄다.
 */
interface MultiSelectQuizProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number, wrongWords: QuizWrongWord[]) => void;
}

const PASS_THRESHOLD = 80;
/** 채점 후 다음 문제로 넘어가기까지 — 보기 여러 개의 O/X를 훑어볼 시간을 준다 */
const ADVANCE_DELAY_CORRECT = 900;
const ADVANCE_DELAY_WRONG = 2000;

export function MultiSelectQuiz({ vocabulary, onComplete }: MultiSelectQuizProps) {
  // ⚠️ useMemo([vocabulary])는 리렌더로 배열 참조가 바뀔 때 문제 전체가 재생성된다
  // (quick-quiz에서 겪은 사고) → 마운트 시 1회만 생성.
  const [questions, setQuestions] = useState(() => generateMultiSelectQuestions(vocabulary));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [correct, setCorrect] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [graded, setGraded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongWordsRef = useRef<QuizWrongWord[]>([]);

  const question = questions[currentIndex];

  const toggle = useCallback((word: string) => {
    if (graded) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }, [graded]);

  const handleConfirm = useCallback(() => {
    if (graded || selected.size === 0) return;
    setGraded(true);

    const isCorrect = isExactMatch(selected, question.answers);
    if (isCorrect) {
      setCorrect((c) => c + 1);
    } else {
      wrongWordsRef.current.push({ front_text: question.front_text, back_text: question.back_text });
    }

    timerRef.current = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
        setSelected(new Set());
        setGraded(false);
      } else {
        const score = Math.round(((correct + (isCorrect ? 1 : 0)) / questions.length) * 100);
        setFinalScore(score);
        // 통과 시엔 "다음 단계로" 클릭을 기다렸다가 onComplete (QuickQuiz와 동일한 규약)
        if (score < PASS_THRESHOLD) onComplete(score, wrongWordsRef.current);
      }
    }, isCorrect ? ADVANCE_DELAY_CORRECT : ADVANCE_DELAY_WRONG);
  }, [graded, selected, question, currentIndex, questions.length, correct, onComplete]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function handleRetry() {
    setQuestions(generateMultiSelectQuestions(vocabulary));
    setCurrentIndex(0);
    setSelected(new Set());
    setCorrect(0);
    setFinalScore(null);
    setGraded(false);
    wrongWordsRef.current = [];
  }

  if (questions.length === 0) {
    // 보기 구성이 불가능한 Day (안전한 오답 부족) — 부모가 4지선다로 폴백하도록
    // 여기 오기 전에 걸러지는 게 정상이지만, 방어적으로 빈 화면 대신 통과 처리하지
    // 않고 안내만 한다.
    return (
      <div className="neon-container p-6 min-h-[40dvh] flex items-center justify-center">
        <p className="text-gray-400">이 Day는 복수 선택 퀴즈를 만들 수 없습니다.</p>
      </div>
    );
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
            className="w-full max-w-md space-y-6"
          >
            <p className="voca-display text-xs text-center mb-1" style={{ color: VOCA_COLORS.blue, fontWeight: 700 }}>
              해당하는 단어를 모두 고르세요
            </p>
            <p
              className="voca-display text-center text-4xl"
              style={{ color: VOCA_COLORS.blue, fontWeight: 700, wordBreak: 'keep-all' }}
            >
              {question.prompt}
            </p>

            <div className="space-y-3">
              {question.options.map((word, i) => {
                const isSelected = selected.has(word);
                const isAnswer = question.answers.includes(word);
                // 채점 후: 정답은 전부 초록(놓친 것도 보여준다), 잘못 고른 것만 빨강
                const showCorrect = graded && isAnswer;
                const showWrong = graded && isSelected && !isAnswer;

                const theme = VOCA_STEP_THEMES[i % VOCA_STEP_THEMES.length];
                return (
                  <button
                    key={word}
                    onClick={() => toggle(word)}
                    disabled={graded}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex w-full items-center gap-3 py-3.5 px-4 rounded-2xl border-2 text-left text-lg font-medium transition-all',
                      !graded && !isSelected && 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 active:scale-[0.99]',
                      !graded && isSelected && 'border-blue-500 bg-blue-50 text-blue-700',
                      showCorrect && 'border-green-500 bg-green-50 text-green-700',
                      showWrong && 'border-red-500 bg-red-50 text-red-600 wrong-shake',
                      graded && !showCorrect && !showWrong && 'border-gray-100 text-gray-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm transition-colors',
                        !graded && !isSelected && 'border-gray-300 bg-white text-transparent',
                        !graded && isSelected && 'border-blue-500 bg-blue-500 text-white',
                        showCorrect && 'border-green-500 bg-green-500 text-white',
                        showWrong && 'border-red-500 bg-red-500 text-white',
                        graded && !showCorrect && !showWrong && 'border-gray-200 bg-white text-transparent',
                      )}
                      style={!graded && !isSelected ? { borderColor: theme.bg } : undefined}
                    >
                      ✓
                    </span>
                    {word}
                    {graded && isAnswer && !isSelected && (
                      <span className="ml-auto text-xs font-bold text-green-600">놓쳤어요</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleConfirm}
              disabled={graded || selected.size === 0}
              className={cn(
                'voca-display w-full rounded-full py-3.5 text-lg transition-all',
                selected.size > 0 && !graded
                  ? 'text-white hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300',
              )}
              style={selected.size > 0 && !graded ? { background: VOCA_COLORS.blue, fontWeight: 700 } : { fontWeight: 700 }}
            >
              확인
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
