'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';
import { vocabToMemoryItem } from '@/lib/naesin/adapters';
import { QuizSetSelector } from '../quiz-set-selector';
import { NaesinFlashcardView } from './flashcard-view';
import { NaesinQuizView } from './quiz-view';
import { NaesinSpellingView } from './spelling-view';
import { VocabOnboardingModal } from './vocab-onboarding-modal';
import { VocabStepIndicator } from './vocab-step-indicator';
import type { NaesinVocabulary, NaesinVocabQuizSet } from '@/types/database';
import type { VocabProgress } from '@/app/(dashboard)/student/naesin/[unitId]/[stage]/client';

interface VocabTabProps {
  vocabulary: NaesinVocabulary[];
  unitId: string;
  onStageComplete: () => void;
  quizSets?: NaesinVocabQuizSet[];
  completedSetIds?: string[];
  vocabProgress?: VocabProgress;
  onNavigateToNextStage?: () => void;
}

const ONBOARDING_KEY = 'naesin-vocab-onboarding-seen';

export function VocabTab({ vocabulary, unitId, onStageComplete, quizSets, completedSetIds, vocabProgress, onNavigateToNextStage }: VocabTabProps) {
  const [activeTab, setActiveTab] = useState('flashcard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const hasQuizSets = quizSets && quizSets.length > 0;

  // Show onboarding modal on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowOnboarding(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // localStorage unavailable
    }
  }

  // Local progress state (updated after API calls)
  const [localProgress, setLocalProgress] = useState({
    flashcardDone: (vocabProgress?.flashcardCount ?? 0) > 0,
    quizScore: vocabProgress?.quizScore ?? null as number | null,
    spellingScore: vocabProgress?.spellingScore ?? null as number | null,
  });

  const completedSet = useMemo(
    () => new Set(completedSetIds || []),
    [completedSetIds]
  );

  // Find first uncompleted set or default to first
  const firstUncompletedSet = hasQuizSets
    ? quizSets.find((s) => !completedSet.has(s.id))?.id || quizSets[0].id
    : null;
  const [activeSetId, setActiveSetId] = useState<string | null>(firstUncompletedSet);

  // Filter vocabulary by active quiz set
  const filteredVocabulary = useMemo(() => {
    if (!hasQuizSets || !activeSetId) return vocabulary;
    const activeSet = quizSets.find((s) => s.id === activeSetId);
    if (!activeSet) return vocabulary;
    const vocabIdSet = new Set(activeSet.vocab_ids);
    return vocabulary.filter((v) => vocabIdSet.has(v.id));
  }, [hasQuizSets, activeSetId, quizSets, vocabulary]);

  const items = filteredVocabulary.map(vocabToMemoryItem);
  const hasEnoughForQuiz = filteredVocabulary.length >= 4;
  const spellingItems = items.filter((i) => i.spelling_answer);
  const hasSpelling = spellingItems.length > 0;

  const goToQuiz = useCallback(() => {
    if (hasEnoughForQuiz) setActiveTab('quiz');
  }, [hasEnoughForQuiz]);

  const goToSpelling = useCallback(() => {
    if (hasSpelling) setActiveTab('spelling');
  }, [hasSpelling]);

  async function saveVocabProgress(type: 'flashcard' | 'quiz' | 'spelling', score?: number) {
    try {
      const res = await fetch('/api/naesin/vocab/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type, score, totalItems: filteredVocabulary.length }),
      });
      const data = await res.json();

      // Update local progress state
      if (type === 'flashcard') {
        setLocalProgress((prev) => ({ ...prev, flashcardDone: true }));
      } else if (type === 'quiz') {
        setLocalProgress((prev) => ({ ...prev, quizScore: score ?? prev.quizScore }));
      } else if (type === 'spelling') {
        setLocalProgress((prev) => ({ ...prev, spellingScore: score ?? prev.spellingScore }));
      }

      if (data.vocabCompleted) {
        toast.success('단어 암기 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch (err) {
      console.error(err);
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  async function saveQuizSetResult(score: number, wrongWords: { front_text: string; back_text: string }[]) {
    if (!activeSetId) return;
    try {
      await fetch('/api/naesin/vocab/quiz-set-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizSetId: activeSetId, unitId, score, wrongWords }),
      });
    } catch (err) {
      console.error(err);
      }
  }

  if (vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          등록된 단어가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Onboarding Modal */}
      <VocabOnboardingModal open={showOnboarding} onClose={dismissOnboarding} hasSpelling={hasSpelling} />

      {/* Step Indicator */}
      <VocabStepIndicator
        activeTab={activeTab}
        flashcardDone={localProgress.flashcardDone}
        quizScore={localProgress.quizScore}
        spellingScore={localProgress.spellingScore}
        hasSpelling={hasSpelling}
      />

      {hasQuizSets && (
        <QuizSetSelector
          quizSets={quizSets}
          completedSetIds={completedSet}
          activeSetId={activeSetId}
          onSelect={setActiveSetId}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flashcard">플래시카드</TabsTrigger>
          <TabsTrigger value="quiz" disabled={!hasEnoughForQuiz}>
            퀴즈
          </TabsTrigger>
          <TabsTrigger value="spelling" disabled={!hasSpelling}>
            스펠링
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcard" className="mt-4">
          <NaesinFlashcardView
            key={activeSetId || 'all'}
            items={items}
            vocabulary={filteredVocabulary}
            onComplete={() => saveVocabProgress('flashcard')}
            onGoToQuiz={hasEnoughForQuiz ? goToQuiz : undefined}
          />
        </TabsContent>

        <TabsContent value="quiz" className="mt-4">
          <NaesinQuizView
            key={activeSetId || 'all'}
            vocabulary={filteredVocabulary}
            allVocabulary={vocabulary}
            unitId={unitId}
            onComplete={(score) => saveVocabProgress('quiz', score)}
            onQuizSetResult={hasQuizSets ? saveQuizSetResult : undefined}
            onGoToSpelling={hasSpelling ? goToSpelling : undefined}
          />
        </TabsContent>

        <TabsContent value="spelling" className="mt-4">
          <NaesinSpellingView
            key={activeSetId || 'all'}
            items={spellingItems}
            vocabulary={filteredVocabulary}
            onComplete={(score) => saveVocabProgress('spelling', score)}
            onGoToNextStage={onNavigateToNextStage}
            quizScore={localProgress.quizScore}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
