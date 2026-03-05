'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, BookOpen, FileText, GraduationCap, ClipboardList, Brain, ArrowLeft } from 'lucide-react';
import { VocabTab } from '@/components/naesin/vocab-tab';
import { PassageTab } from '@/components/naesin/passage-tab';
import { GrammarTab } from '@/components/naesin/grammar-tab';
import { ProblemTab } from '@/components/naesin/problem-tab';
import { LastReviewTab } from '@/components/naesin/last-review-tab';
import { ExamCountdown } from '@/components/naesin/exam-countdown';
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

interface NaesinUnitDetailProps {
  unit: { id: string; unit_number: number; title: string };
  vocabulary: NaesinVocabulary[];
  passages: NaesinPassage[];
  grammarLessons: NaesinGrammarLesson[];
  stageStatuses: NaesinStageStatuses;
  quizSets?: NaesinVocabQuizSet[];
  completedSetIds?: string[];
  videoProgress?: NaesinGrammarVideoProgress[];
  problemSheets?: NaesinProblemSheet[];
  lastReviewProblemSheets?: NaesinProblemSheet[];
  similarProblems?: NaesinSimilarProblem[];
  reviewContent?: NaesinLastReviewContent[];
  examDate?: string | null;
}

const STAGE_CONFIG = [
  { key: 'vocab' as const, label: '단어 암기', shortLabel: '단어', icon: BookOpen },
  { key: 'passage' as const, label: '교과서 암기', shortLabel: '교과서', icon: FileText },
  { key: 'grammar' as const, label: '문법 설명', shortLabel: '문법', icon: GraduationCap },
  { key: 'problem' as const, label: '문제풀이', shortLabel: '문제', icon: ClipboardList },
  { key: 'lastReview' as const, label: '직전보강', shortLabel: '보강', icon: Brain },
];

export function NaesinUnitDetail({
  unit,
  vocabulary,
  passages,
  grammarLessons,
  stageStatuses,
  quizSets,
  completedSetIds,
  videoProgress,
  problemSheets,
  lastReviewProblemSheets,
  similarProblems,
  reviewContent,
  examDate,
}: NaesinUnitDetailProps) {
  const router = useRouter();

  // Find the first available (unlocked, not completed) tab, or the first tab
  type StageKey = typeof STAGE_CONFIG[number]['key'];

  const firstAvailable = STAGE_CONFIG.find(
    (s) => stageStatuses[s.key] === 'available'
  )?.key || STAGE_CONFIG[0].key;

  const [activeTab, setActiveTab] = useState<StageKey>(firstAvailable);

  function handleStageComplete() {
    router.refresh();
  }

  function handleTabChange(value: string) {
    const stageKey = value as StageKey;
    if (stageStatuses[stageKey] === 'locked') return;
    setActiveTab(stageKey);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/naesin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            Lesson {unit.unit_number}. {unit.title}
          </h2>
        </div>
      </div>

      {examDate && <ExamCountdown examDate={examDate} />}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          {STAGE_CONFIG.map((stage) => {
            const status = stageStatuses[stage.key];
            return (
              <TabsTrigger
                key={stage.key}
                value={stage.key}
                disabled={status === 'locked'}
                className="gap-1 text-xs sm:text-sm"
              >
                <StageIcon status={status} />
                <span className="hidden sm:inline">{stage.label}</span>
                <span className="sm:hidden">{stage.shortLabel}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="vocab" className="mt-4">
          <VocabTab
            vocabulary={vocabulary}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
            quizSets={quizSets}
            completedSetIds={completedSetIds}
          />
        </TabsContent>

        <TabsContent value="passage" className="mt-4">
          <PassageTab
            passages={passages}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>

        <TabsContent value="grammar" className="mt-4">
          <GrammarTab
            lessons={grammarLessons}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
            videoProgress={videoProgress}
          />
        </TabsContent>

        <TabsContent value="problem" className="mt-4">
          <ProblemTab
            sheets={problemSheets || []}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>

        <TabsContent value="lastReview" className="mt-4">
          <LastReviewTab
            unitId={unit.id}
            problemSheets={lastReviewProblemSheets || []}
            similarProblems={similarProblems || []}
            reviewContent={reviewContent || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StageIcon({ status }: { status: NaesinStageStatus }) {
  if (status === 'completed') return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  if (status === 'locked') return <Lock className="h-3.5 w-3.5" />;
  return null;
}
