'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { StepProgressBar } from './step-progress-bar';
import { NeonFlashcard } from './neon-flashcard';
import { RhythmSpelling } from './rhythm-spelling';
import { WordMatching } from './word-matching';
import { QuickQuiz, type QuizWrongWord } from './quick-quiz';
import { VocaDayRankCard, type VocaDayRankCardProps } from '@/components/voca/voca-day-rank-card';
import { PetReaction } from '@/components/voca/pet/pet-reaction';
import { usePet } from '@/hooks/use-pet';
import { EMPTY_VOCA_PROGRESS, type VocaVocabulary, type VocaStudentProgress } from '@/types/voca';
import type { PetFeedResult } from '@/lib/voca/pet-constants';

type RankData = Omit<VocaDayRankCardProps, 'onClose' | 'dayTitle'>;

interface NeonVocaTabProps {
  vocabulary: VocaVocabulary[];
  dayId: string;
  progress: VocaStudentProgress | null;
  dayTitle: string;
}

const STEP_LABELS = ['플래시카드', '매칭', '스펠링', '퀴즈'];

// Step 완료 여부 판단
function getStepStates(p: VocaStudentProgress | null) {
  const pr = p ?? EMPTY_VOCA_PROGRESS;
  return [
    pr.flashcard_completed || (pr.quiz_score ?? 0) >= 80, // Step 1: 플래시카드
    pr.matching_completed,                                  // Step 2: 매칭
    (pr.spelling_score ?? 0) >= 80,                         // Step 3: 스펠링
    (pr.quiz_score ?? 0) >= 80,                             // Step 4: 퀴즈
  ];
}

export function NeonVocaTab({ vocabulary, dayId, progress, dayTitle }: NeonVocaTabProps) {
  const [localProgress, setLocalProgress] = useState(progress);
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [petReaction, setPetReaction] = useState<PetFeedResult | null>(null);
  const pet = usePet();
  const completedSteps = useMemo(() => getStepStates(localProgress), [localProgress]);

  // 현재 Step: 첫 번째 미완료 Step (모두 완료면 마지막)
  const initialStep = completedSteps.findIndex((c) => !c);
  const [currentStep, setCurrentStep] = useState(initialStep === -1 ? 0 : initialStep);
  const [celebrateStep, setCelebrateStep] = useState<number | null>(null);
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    completed: completedSteps[i],
    unlocked: true,
  }));

  const saveProgress = useCallback(async (
    type: 'flashcard' | 'quiz' | 'spelling' | 'matching',
    score?: number,
    spellingWrongWords?: { front_text: string; back_text: string }[],
  ) => {
    try {
      await fetchWithToast('/api/voca/progress', {
        body: { dayId, type, score, spellingWrongWords },
        silent: true,
      });
    } catch { /* swallow */ }

    setLocalProgress((prev) => {
      const base = prev ?? EMPTY_VOCA_PROGRESS;
      if (type === 'flashcard') return { ...base, flashcard_completed: true };
      if (type === 'spelling') return { ...base, spelling_score: score ?? 0 };
      if (type === 'matching') return { ...base, matching_completed: (score ?? 0) >= 90, matching_score: score ?? 0 };
      if (type === 'quiz') return { ...base, quiz_score: score ?? 0 };
      return base;
    });
  }, [dayId]);

  const saveQuizResult = useCallback(async (score: number, wrongWords: QuizWrongWord[], totalQuestions: number) => {
    try {
      await fetchWithToast('/api/voca/quiz-result', {
        body: {
          unitId: dayId,
          score,
          totalQuestions,
          correctCount: totalQuestions - wrongWords.length,
          wrongWords,
        },
        silent: true,
      });
    } catch { /* swallow */ }
  }, [dayId]);

  const handleStepComplete = useCallback((stepIndex: number, type: 'flashcard' | 'quiz' | 'spelling' | 'matching', score?: number, wrongWords?: { front_text: string; back_text: string }[]) => {
    saveProgress(type, score, type === 'spelling' ? wrongWords : undefined);

    // 퀴즈 오답을 voca_quiz_results에 별도 저장
    if (type === 'quiz' && score !== undefined) {
      saveQuizResult(score, wrongWords || [], vocabulary.length);
    }

    // 통과 기준 체크
    const passed =
      (type === 'flashcard') ||
      (type === 'spelling' && (score ?? 0) >= 80) ||
      (type === 'matching' && (score ?? 0) >= 90) ||
      (type === 'quiz' && (score ?? 0) >= 80);

    if (passed) {
      setCelebrateStep(stepIndex);
      const nextStep = stepIndex + 1;

      celebrateTimerRef.current = setTimeout(() => {
        setCelebrateStep(null);
        if (nextStep < STEP_LABELS.length) {
          setCurrentStep(nextStep);
        } else {
          // 랭킹 API 호출
          fetch(`/api/voca/day-ranking?dayId=${dayId}`)
            .then((r) => r.json())
            .then((data) => {
              setRankData(data);
              // 펫 먹이 주기
              const scores = data.scores as { quiz: number; spelling: number; matching: number };
              pet.feed(dayId, scores, 0).then((result) => {
                if (result && result.xpEarned > 0) setPetReaction(result);
              });
            })
            .catch(() => toast.success('모든 단계 완료!'));
        }
      }, 1500);
    } else {
      toast.info('기준 점수에 도달하지 못했습니다. 다시 도전해보세요!');
    }
  }, [saveProgress, saveQuizResult, dayId, pet, vocabulary.length]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current); };
  }, []);

  if (vocabulary.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 단어가 없습니다.
      </p>
    );
  }

  // 퀴즈 최소 4개 필요
  const hasEnoughForQuiz = vocabulary.length >= 4;

  return (
    <div className="space-y-4">
      {/* Step Progress Bar */}
      <div className="neon-container px-3 py-1">
        <StepProgressBar
          steps={steps}
          currentStep={currentStep}
          onStepClick={(i) => {
            if (steps[i].unlocked) setCurrentStep(i);
          }}
        />
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrateStep !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="text-center space-y-3"
            >
              <p className="text-4xl font-bold text-green-500">CLEAR!</p>
              <p className="text-white/80">{STEP_LABELS[celebrateStep]} 완료</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 0 && (
            <NeonFlashcard
              vocabulary={vocabulary}
              onComplete={() => handleStepComplete(0, 'flashcard')}
            />
          )}
          {currentStep === 1 && (
            <WordMatching
              vocabulary={vocabulary}
              onComplete={(score) => handleStepComplete(1, 'matching', score)}
            />
          )}
          {currentStep === 2 && (
            <RhythmSpelling
              vocabulary={vocabulary}
              onComplete={(score, wrongWords) => handleStepComplete(2, 'spelling', score, wrongWords)}
            />
          )}
          {currentStep === 3 && (
            hasEnoughForQuiz ? (
              <QuickQuiz
                vocabulary={vocabulary}
                onComplete={(score, wrongWords) => handleStepComplete(3, 'quiz', score, wrongWords)}
              />
            ) : (
              <div className="neon-container p-6 text-center">
                <p className="text-gray-400">퀴즈에는 최소 4개 단어가 필요합니다.</p>
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Ranking Card */}
      {rankData && (
        <VocaDayRankCard
          {...rankData}
          dayTitle={dayTitle}
          onClose={() => setRankData(null)}
        />
      )}

      {/* Pet Reaction */}
      {petReaction && (
        <PetReaction result={petReaction} onClose={() => setPetReaction(null)} />
      )}
    </div>
  );
}
