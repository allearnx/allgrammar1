'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle,
  Lock,
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardList,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VocabTab } from '@/components/naesin/vocab-tab';
import { PassageTab } from '@/components/naesin/passage-tab';
import { GrammarTab } from '@/components/naesin/grammar-tab';
import { ProblemTab } from '@/components/naesin/problem-tab';
import { LastReviewTab } from '@/components/naesin/last-review-tab';
import type {
  NaesinVocabulary,
  NaesinPassage,
  NaesinGrammarLesson,
  NaesinStageStatuses,
  NaesinStageStatus,
  NaesinVocabQuizSet,
  NaesinGrammarVideoProgress,
  NaesinProblemSheet,
  NaesinSimilarProblem,
  NaesinLastReviewContent,
} from '@/types/database';
import Link from 'next/link';

type StageKey = 'vocab' | 'passage' | 'grammar' | 'problem' | 'lastReview';

const STAGE_CONFIG = [
  { key: 'vocab' as const, label: '단어 암기', shortLabel: '단어', icon: BookOpen },
  { key: 'passage' as const, label: '교과서 암기', shortLabel: '교과서', icon: FileText },
  { key: 'grammar' as const, label: '문법 설명', shortLabel: '문법', icon: GraduationCap },
  { key: 'problem' as const, label: '문제풀이', shortLabel: '문제', icon: ClipboardList },
  { key: 'lastReview' as const, label: '직전보강', shortLabel: '보강', icon: Brain },
];

interface StageData {
  // vocab
  vocabulary?: NaesinVocabulary[];
  quizSets?: NaesinVocabQuizSet[];
  completedSetIds?: string[];
  // passage
  passages?: NaesinPassage[];
  // grammar
  grammarLessons?: NaesinGrammarLesson[];
  videoProgress?: NaesinGrammarVideoProgress[];
  // problem
  problemSheets?: NaesinProblemSheet[];
  // lastReview
  lastReviewProblemSheets?: NaesinProblemSheet[];
  similarProblems?: NaesinSimilarProblem[];
  reviewContent?: NaesinLastReviewContent[];
}

interface NaesinStageViewProps {
  unit: { id: string; unit_number: number; title: string };
  currentStage: StageKey;
  stageStatuses: NaesinStageStatuses;
  stageData: StageData;
  examDate?: string | null;
}

export function NaesinStageView({
  unit,
  currentStage,
  stageStatuses,
  stageData,
  examDate,
}: NaesinStageViewProps) {
  const router = useRouter();

  function handleStageComplete() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/student/naesin">
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록으로
        </Link>
      </Button>

      {/* 5-stage navigation bar */}
      <nav className="flex rounded-lg border bg-muted/30 p-1 gap-1">
        {STAGE_CONFIG.map((stage) => {
          const status = stageStatuses[stage.key];
          const isLocked = status === 'locked';
          const isCurrent = stage.key === currentStage;
          const Icon = stage.icon;

          if (isLocked) {
            return (
              <div
                key={stage.key}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs sm:text-sm opacity-40 cursor-not-allowed"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{stage.label}</span>
                <span className="sm:hidden">{stage.shortLabel}</span>
              </div>
            );
          }

          return (
            <Link
              key={stage.key}
              href={`/student/naesin/${unit.id}/${stage.key}`}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs sm:text-sm transition-colors',
                isCurrent
                  ? 'bg-background shadow-sm font-semibold text-primary'
                  : 'hover:bg-background/50 text-muted-foreground'
              )}
            >
              <StageIcon status={status} FallbackIcon={Icon} />
              <span className="hidden sm:inline">{stage.label}</span>
              <span className="sm:hidden">{stage.shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* Stage content */}
      <div>
        {currentStage === 'vocab' && (
          <VocabTab
            vocabulary={stageData.vocabulary || []}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
            quizSets={stageData.quizSets}
            completedSetIds={stageData.completedSetIds}
          />
        )}
        {currentStage === 'passage' && (
          <PassageTab
            passages={stageData.passages || []}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
          />
        )}
        {currentStage === 'grammar' && (
          <GrammarTab
            lessons={stageData.grammarLessons || []}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
            videoProgress={stageData.videoProgress}
          />
        )}
        {currentStage === 'problem' && (
          <ProblemTab
            sheets={stageData.problemSheets || []}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
          />
        )}
        {currentStage === 'lastReview' && (
          <LastReviewTab
            unitId={unit.id}
            problemSheets={stageData.lastReviewProblemSheets || []}
            similarProblems={stageData.similarProblems || []}
            reviewContent={stageData.reviewContent || []}
          />
        )}
      </div>
    </div>
  );
}

function StageIcon({ status, FallbackIcon }: { status: NaesinStageStatus; FallbackIcon: React.ComponentType<{ className?: string }> }) {
  if (status === 'completed') return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  return <FallbackIcon className="h-3.5 w-3.5" />;
}
