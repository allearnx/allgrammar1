'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { StepProgressBar } from './step-progress-bar';
import { VocaBrandStyle } from '@/components/voca/voca-brand';
import { NeonFlashcard } from './neon-flashcard';
import { RhythmSpelling } from './rhythm-spelling';
import { WordMatching } from './word-matching';
import { QuickQuiz, type QuizWrongWord } from './quick-quiz';
import { VocaDayRankCard, type VocaDayRankCardProps } from '@/components/voca/voca-day-rank-card';
import { EMPTY_VOCA_PROGRESS, type VocaVocabulary, type VocaStudentProgress } from '@/types/voca';
import { shuffle } from '@/lib/utils';

const EXAM_PASS = 90;

type RankData = Omit<VocaDayRankCardProps, 'onClose' | 'dayTitle'>;

interface NeonVocaTabProps {
  vocabulary: VocaVocabulary[];
  dayId: string;
  progress: VocaStudentProgress | null;
  dayTitle: string;
}

// 핵심 4단계 (완료 판정 대상). 시험은 보너스라 여기 포함하지 않는다.
// 순서: 플래시카드 → 매칭 → 퀴즈 → 스펠링 (스펠링을 마지막에 둬 가장 어려운 산출로 마무리)
const STEP_LABELS = ['플래시카드', '매칭', '퀴즈', '스펠링'];

// Step 완료 여부 판단
function getStepStates(p: VocaStudentProgress | null) {
  const pr = p ?? EMPTY_VOCA_PROGRESS;
  return [
    pr.flashcard_completed || (pr.quiz_score ?? 0) >= 80, // Step 1: 플래시카드
    pr.matching_completed,                                  // Step 2: 매칭
    (pr.quiz_score ?? 0) >= 80,                             // Step 3: 퀴즈
    (pr.spelling_score ?? 0) >= 80,                         // Step 4: 스펠링
  ];
}

export function NeonVocaTab({ vocabulary, dayId, progress, dayTitle }: NeonVocaTabProps) {
  const router = useRouter();
  const [localProgress, setLocalProgress] = useState(progress);
  const [rankData, setRankData] = useState<RankData | null>(null);
  const completedSteps = useMemo(() => getStepStates(localProgress), [localProgress]);
  // 시험은 표제어를 항상 셔플해서 출제 (연습 단계와 순서를 다르게)
  const examVocab = useMemo(() => shuffle([...vocabulary]), [vocabulary]);

  // 현재 Step: 첫 번째 미완료 Step (모두 완료면 마지막)
  const initialStep = completedSteps.findIndex((c) => !c);
  const [currentStep, setCurrentStep] = useState(initialStep === -1 ? 0 : initialStep);
  const [celebrateStep, setCelebrateStep] = useState<number | null>(null);
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 보너스 시험 (선택) — 핵심 4단계 완료와 무관
  const [inExam, setInExam] = useState(false);
  const examBest = localProgress?.exam_score ?? null;
  // 4단계 모두 완료했는지 (보너스 카드는 이때만 노출 → 단계 진행 중 이탈로 초기화되는 것 방지)
  const allStepsDone = completedSteps.every(Boolean);

  // Day 완료 후 홈으로 이동 + 새로고침 (완료 상태가 목록에 바로 반영되도록)
  const goHome = useCallback(() => {
    router.push('/student/voca');
    router.refresh();
  }, [router]);

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    completed: completedSteps[i],
    unlocked: true,
  }));

  const saveProgress = useCallback(async (
    type: 'flashcard' | 'quiz' | 'spelling' | 'matching' | 'exam',
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
      if (type === 'exam') return { ...base, exam_score: Math.max(score ?? 0, base.exam_score ?? 0) };
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
    // 저장 프로미스를 잡아둔다 — 마지막 단계에서 랭킹 조회 전에 저장 완료를 보장하기 위해
    const savePromise = saveProgress(type, score, type === 'spelling' ? wrongWords : undefined);

    // 퀴즈 오답을 voca_quiz_results에 별도 저장
    const quizSavePromise = (type === 'quiz' && score !== undefined)
      ? saveQuizResult(score, wrongWords || [], vocabulary.length)
      : Promise.resolve();

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
          // ⭐ 마지막 단계 점수가 서버에 반영된 뒤 랭킹 조회 (안 그러면 총점 0으로 뜸)
          Promise.all([savePromise, quizSavePromise])
            .then(() => fetch(`/api/voca/day-ranking?dayId=${dayId}`))
            .then((r) => r.json())
            .then((data) => {
              setRankData(data);
            })
            .catch(() => toast.success('모든 단계 완료!'));
        }
      }, 1500);
    } else {
      toast.info('기준 점수에 도달하지 못했습니다. 다시 도전해보세요!');
    }
  }, [saveProgress, saveQuizResult, dayId, vocabulary.length]);

  // 보너스 시험 완료 — 점수만 기록(최고점), 4단계 완료/랭킹에는 영향 없음
  const handleExamComplete = useCallback((score: number, wrongWords?: { front_text: string; back_text: string }[]) => {
    saveProgress('exam', score, wrongWords);
    setInExam(false);
    if (score >= EXAM_PASS) {
      toast.success(`🎉 보너스 시험 통과! ${score}점`);
    } else {
      toast.info(`보너스 시험 ${score}점 — ${EXAM_PASS}점 넘으면 통과예요. 또 도전해보세요!`);
    }
  }, [saveProgress]);

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

  // 보너스 시험 진행 화면 (선택)
  if (inExam) {
    return (
      <div className="space-y-3">
        <button onClick={() => setInExam(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700">
          ← 돌아가기
        </button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
          <p className="text-lg font-extrabold text-rose-600">📝 표제어 스펠링 시험 (보너스)</p>
          <p className="mt-0.5 text-xs text-rose-500">{EXAM_PASS}점 넘으면 통과! 순서는 매번 섞여요. 안 봐도 진도엔 영향 없어요.</p>
        </div>
        <RhythmSpelling vocabulary={examVocab} onComplete={handleExamComplete} examMode />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VocaBrandStyle />
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
            hasEnoughForQuiz ? (
              <QuickQuiz
                vocabulary={vocabulary}
                onComplete={(score, wrongWords) => handleStepComplete(2, 'quiz', score, wrongWords)}
              />
            ) : (
              <div className="neon-container p-6 text-center">
                <p className="text-gray-400">퀴즈에는 최소 4개 단어가 필요합니다.</p>
              </div>
            )
          )}
          {currentStep === 3 && (
            <RhythmSpelling
              vocabulary={vocabulary}
              storageContext={`day:${dayId}`}
              onComplete={(score, wrongWords) => handleStepComplete(3, 'spelling', score, wrongWords)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 🎁 보너스: 표제어 스펠링 시험 — 4단계 완료 후에만 노출 (진행 중 이탈로 초기화 방지) */}
      {allStepsDone && (
        <button
          onClick={() => setInExam(true)}
          className="w-full rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50 px-4 py-3 text-left transition-colors hover:border-rose-300 hover:bg-rose-50"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-rose-600">🎁 보너스: 표제어 스펠링 시험</p>
              <p className="mt-0.5 text-xs text-rose-400">선택! 도전하면 점수가 기록돼요 ({EXAM_PASS}점 통과 · 순서 매번 셔플)</p>
            </div>
            {examBest != null ? (
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${examBest >= EXAM_PASS ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                최고 {examBest}점
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-600">도전하기 →</span>
            )}
          </div>
        </button>
      )}

      {/* Ranking Card — 닫으면 홈으로 (완료 반영) */}
      {rankData && (
        <VocaDayRankCard
          {...rankData}
          dayTitle={dayTitle}
          onClose={goHome}
        />
      )}
    </div>
  );
}
