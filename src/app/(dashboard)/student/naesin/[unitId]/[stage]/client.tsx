'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Crown,
  BookOpen,
  FileText,
  MessageSquare,
  PlayCircle,
  GraduationCap,
  ClipboardList,
  FileQuestion,
  Brain,
  CheckCircle,
} from 'lucide-react';
import { VocabTab } from '@/components/naesin/vocab-tab';
import { PassageTab } from '@/components/naesin/passage-tab';
import { GrammarTab } from '@/components/naesin/grammar-tab';
import { DialogueTab } from '@/components/naesin/dialogue-tab';
import { ProblemTab } from '@/components/naesin/problem-tab';
import { TextbookVideoTab } from '@/components/naesin/textbook-video-tab';
import { LastReviewTab } from '@/components/naesin/last-review-tab';
import type {
  NaesinVocabulary,
  NaesinPassage,
  NaesinGrammarLesson,
  NaesinStageStatuses,
  NaesinVocabQuizSet,
  NaesinGrammarVideoProgress,
  NaesinTextbookVideo,
  NaesinTextbookVideoProgress,
  NaesinSimilarProblem,
  NaesinLastReviewContent,
} from '@/types/database';
import type { NaesinDialogue, NaesinProblemSheet, NaesinProblemSheetLite } from '@/types/naesin';
import Link from 'next/link';
import { useLearningSession } from '@/hooks/use-learning-session';
import { StageNavBar } from './stage-nav-bar';

type StageKey = 'vocab' | 'passage' | 'dialogue' | 'textbookVideo' | 'grammar' | 'problem' | 'mockExam' | 'lastReview';

const STAGE_CONFIG = [
  { key: 'vocab' as const, label: '단어 암기', shortLabel: '단어', icon: BookOpen, unlockHint: null },
  { key: 'passage' as const, label: '교과서 암기', shortLabel: '교과서', icon: FileText, unlockHint: '단어 암기 80% 이상 달성 시 해금' },
  { key: 'dialogue' as const, label: '대화문 암기', shortLabel: '대화문', icon: MessageSquare, unlockHint: '교과서 암기 80% 이상 달성 시 해금' },
  { key: 'textbookVideo' as const, label: '설명 영상', shortLabel: '영상', icon: PlayCircle, unlockHint: '대화문 암기 완료 시 해금' },
  { key: 'grammar' as const, label: '문법 설명', shortLabel: '문법', icon: GraduationCap, unlockHint: '설명 영상 완료 시 해금' },
  { key: 'problem' as const, label: '문제풀이', shortLabel: '문제', icon: ClipboardList, unlockHint: '문법 설명 완료 시 해금' },
  { key: 'mockExam' as const, label: '예상문제', shortLabel: '예상', icon: FileQuestion, unlockHint: '문제풀이 완료 시 해금' },
  { key: 'lastReview' as const, label: '직전보강', shortLabel: '보강', icon: Brain, unlockHint: '시험 D-3일 전 자동 해금' },
];

export interface VocabProgress {
  flashcardCount: number;
  quizScore: number | null;
  spellingScore: number | null;
}

interface StageData {
  vocabulary?: NaesinVocabulary[];
  quizSets?: NaesinVocabQuizSet[];
  completedSetIds?: string[];
  vocabProgress?: VocabProgress;
  passages?: NaesinPassage[];
  passageRequiredStages?: string[];
  translationSentencesPerPage?: number;
  dialogues?: NaesinDialogue[];
  textbookVideos?: NaesinTextbookVideo[];
  textbookVideoProgress?: NaesinTextbookVideoProgress[];
  grammarLessons?: NaesinGrammarLesson[];
  videoProgress?: NaesinGrammarVideoProgress[];
  problemSheets?: (NaesinProblemSheet | NaesinProblemSheetLite)[];
  bestScoreBySheet?: Record<string, number>;
  lastAttemptBySheet?: Record<string, {
    score: number;
    total_questions: number;
    wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
    created_at: string;
  }>;
  mockExamSheets?: (NaesinProblemSheet | NaesinProblemSheetLite)[];
  lastReviewProblemSheets?: (NaesinProblemSheet | NaesinProblemSheetLite)[];
  similarProblems?: NaesinSimilarProblem[];
  reviewContent?: NaesinLastReviewContent[];
  naesinRequiredRounds?: number;
  passageRound1Completed?: boolean;
  passageSubStageBests?: Record<string, number | null>;
  dialogueRound1Completed?: boolean;
}

interface NaesinStageViewProps {
  unit: { id: string; unit_number: number; title: string };
  currentStage: StageKey;
  stageStatuses: NaesinStageStatuses;
  stageData: StageData;
  isLocked?: boolean;
  isHidden?: boolean;
  examDate?: string | null;
}

type StageRenderer = (props: {
  stageData: StageData;
  unitId: string;
  onStageComplete: () => void;
  router: ReturnType<typeof useRouter>;
  onActiveSheetChange?: (category: string) => void;
}) => React.ReactNode;

const STAGE_RENDERERS: Record<StageKey, StageRenderer> = {
  vocab: ({ stageData, unitId, onStageComplete, router }) => (
    <VocabTab
      vocabulary={stageData.vocabulary || []}
      unitId={unitId}
      onStageComplete={onStageComplete}
      quizSets={stageData.quizSets}
      completedSetIds={stageData.completedSetIds}
      vocabProgress={stageData.vocabProgress}
      onNavigateToNextStage={() => router.push(`/student/naesin/${unitId}/passage`)}
    />
  ),
  passage: ({ stageData, unitId, onStageComplete }) => (
    <PassageTab
      passages={stageData.passages || []}
      unitId={unitId}
      onStageComplete={onStageComplete}
      requiredStages={stageData.passageRequiredStages}
      translationSentencesPerPage={stageData.translationSentencesPerPage}
      naesinRequiredRounds={stageData.naesinRequiredRounds}
      round1Completed={stageData.passageRound1Completed}
      subStageBests={stageData.passageSubStageBests}
    />
  ),
  dialogue: ({ stageData, unitId, onStageComplete }) => (
    <DialogueTab
      dialogues={stageData.dialogues || []}
      unitId={unitId}
      onStageComplete={onStageComplete}
      naesinRequiredRounds={stageData.naesinRequiredRounds}
      round1Completed={stageData.dialogueRound1Completed}
    />
  ),
  textbookVideo: ({ stageData, unitId, onStageComplete }) => (
    <TextbookVideoTab
      videos={stageData.textbookVideos || []}
      unitId={unitId}
      onStageComplete={onStageComplete}
      videoProgress={stageData.textbookVideoProgress}
    />
  ),
  grammar: ({ stageData, unitId, onStageComplete }) => (
    <GrammarTab
      lessons={stageData.grammarLessons || []}
      unitId={unitId}
      onStageComplete={onStageComplete}
      videoProgress={stageData.videoProgress}
    />
  ),
  problem: ({ stageData, unitId, onStageComplete, onActiveSheetChange }) => (
    <ProblemTab
      sheets={stageData.problemSheets || []}
      unitId={unitId}
      onStageComplete={onStageComplete}
      bestScoreBySheet={stageData.bestScoreBySheet}
      lastAttemptBySheet={stageData.lastAttemptBySheet}
      onActiveSheetChange={onActiveSheetChange}
    />
  ),
  mockExam: ({ stageData, unitId, onStageComplete }) => (
    <ProblemTab
      sheets={stageData.mockExamSheets || []}
      unitId={unitId}
      onStageComplete={onStageComplete}
      bestScoreBySheet={stageData.bestScoreBySheet}
      lastAttemptBySheet={stageData.lastAttemptBySheet}
    />
  ),
  lastReview: ({ stageData, unitId }) => (
    <LastReviewTab
      unitId={unitId}
      problemSheets={stageData.lastReviewProblemSheets || []}
      similarProblems={stageData.similarProblems || []}
      reviewContent={stageData.reviewContent || []}
    />
  ),
};

export function NaesinStageView({
  unit,
  currentStage,
  stageStatuses,
  stageData,
  isLocked: currentStageLocked,
  isHidden: currentStageHidden,
}: NaesinStageViewProps) {
  const router = useRouter();
  const [refinedStage, setRefinedStage] = useState<string>(currentStage);
  const [localStatuses, setLocalStatuses] = useState<NaesinStageStatuses>(stageStatuses);

  // Reset refinedStage and sync statuses when navigating to a different stage
  useEffect(() => {
    setRefinedStage(currentStage);
  }, [currentStage]);

  // Sync server → local when props change (e.g. page navigation)
  useEffect(() => {
    setLocalStatuses(stageStatuses);
  }, [stageStatuses]);

  const handleActiveSheetChange = useCallback((category: string) => {
    if (category === 'external_passage' || category === 'eng_eng_def') {
      setRefinedStage(category);
    } else {
      setRefinedStage(currentStage);
    }
  }, [currentStage]);

  useLearningSession('naesin', unit.id, refinedStage);

  const handleStageComplete = useCallback(() => {
    // router.refresh()를 즉시 호출하면 채점 결과 등 클라이언트 state가 날아감.
    // 대신 로컬 상태만 갱신하여 네비게이션 바에 완료 체크가 즉시 표시되도록 한다.
    setLocalStatuses((prev) => ({
      ...prev,
      [currentStage]: 'completed' as const,
    }));
  }, [currentStage]);

  const currentConfig = STAGE_CONFIG.find((s) => s.key === currentStage);
  const renderStage = STAGE_RENDERERS[currentStage];

  // 현재 스테이지가 완료되었으면 다음 available 스테이지 찾기
  const nextStage = localStatuses[currentStage] === 'completed'
    ? STAGE_CONFIG.find(
        (s) => s.key !== currentStage && localStatuses[s.key] === 'available'
      )
    : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/student/naesin">
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록으로
        </Link>
      </Button>

      <StageNavBar
        stages={STAGE_CONFIG}
        stageStatuses={localStatuses}
        currentStage={currentStage}
        unitId={unit.id}
      />

      {nextStage && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span><span className="font-medium">{currentConfig?.label}</span> 완료!</span>
          </div>
          <Button size="sm" asChild>
            <Link href={`/student/naesin/${unit.id}/${nextStage.key}`}>
              {nextStage.label} 시작하기
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      <div>
        {currentStageHidden ? (
          <PremiumStageOverlay
            label={currentConfig?.label || ''}
            Icon={currentConfig?.icon || Lock}
          />
        ) : currentStageLocked ? (
          <LockedStageOverlay
            label={currentConfig?.label || ''}
            unlockHint={currentConfig?.unlockHint || ''}
            Icon={currentConfig?.icon || Lock}
          />
        ) : (
          renderStage({ stageData, unitId: unit.id, onStageComplete: handleStageComplete, router, onActiveSheetChange: handleActiveSheetChange })
        )}
      </div>
    </div>
  );
}

function LockedStageOverlay({
  label,
  unlockHint,
  Icon,
}: {
  label: string;
  unlockHint: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="blur-sm opacity-40 pointer-events-none select-none" aria-hidden>
        <div className="space-y-4 p-2">
          <div className="h-10 rounded-lg bg-gradient-to-r from-brand-200 to-brand-300 w-3/4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-lg bg-gradient-to-br from-blue-100 to-brand-200" />
            <div className="h-24 rounded-lg bg-gradient-to-br from-pink-100 to-rose-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-gradient-to-r from-emerald-100 to-teal-200 w-full" />
            <div className="h-4 rounded bg-gradient-to-r from-amber-100 to-orange-200 w-5/6" />
            <div className="h-4 rounded bg-gradient-to-r from-sky-100 to-cyan-200 w-4/6" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200" />
            <div className="h-16 rounded-lg bg-gradient-to-br from-brand-100 to-pink-200" />
            <div className="h-16 rounded-lg bg-gradient-to-br from-brand-100 to-blue-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-gradient-to-r from-rose-100 to-pink-200 w-full" />
            <div className="h-4 rounded bg-gradient-to-r from-brand-100 to-brand-200 w-3/4" />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-background/80 backdrop-blur-sm rounded-2xl px-8 py-8 shadow-lg border max-w-xs text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{label}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {unlockHint}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span>이전 단계를 완료하면 열려요</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PremiumStageOverlay({
  label,
  Icon,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="blur-sm opacity-30 pointer-events-none select-none" aria-hidden>
        <div className="space-y-4 p-2">
          <div className="h-10 rounded-lg bg-gradient-to-r from-amber-200 to-yellow-300 w-3/4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-200" />
            <div className="h-24 rounded-lg bg-gradient-to-br from-orange-100 to-amber-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-gradient-to-r from-yellow-100 to-amber-200 w-full" />
            <div className="h-4 rounded bg-gradient-to-r from-amber-100 to-orange-200 w-5/6" />
            <div className="h-4 rounded bg-gradient-to-r from-yellow-100 to-amber-200 w-4/6" />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-background/80 backdrop-blur-sm rounded-2xl px-8 py-8 shadow-lg border max-w-xs text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-amber-50">
            <Crown className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{label}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              유료 서비스에서 이용할 수 있는 기능이에요.
              <br />
              선생님께 문의해 주세요!
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <Icon className="h-3.5 w-3.5" />
            <span>Pro 플랜에서 사용 가능</span>
          </div>
        </div>
      </div>
    </div>
  );
}
