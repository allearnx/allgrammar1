'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { vocabToMemoryItem } from '@/lib/naesin/adapters';
import { QuizSetSelector } from '../quiz-set-selector';
import { NaesinFlashcardView } from './flashcard-view';
import { NaesinQuizView } from './quiz-view';
import { NaesinSpellingView } from './spelling-view';
import type { NaesinVocabulary, NaesinVocabQuizSet } from '@/types/database';

interface VocabTabProps {
  vocabulary: NaesinVocabulary[];
  unitId: string;
  onStageComplete: () => void;
  quizSets?: NaesinVocabQuizSet[];
  completedSetIds?: string[];
}

export function VocabTab({ vocabulary, unitId, onStageComplete, quizSets, completedSetIds }: VocabTabProps) {
  const [activeTab, setActiveTab] = useState('flashcard');
  const hasQuizSets = quizSets && quizSets.length > 0;

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

  async function saveVocabProgress(type: 'flashcard' | 'quiz' | 'spelling', score?: number) {
    try {
      const res = await fetch('/api/naesin/vocab/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type, score, totalItems: filteredVocabulary.length }),
      });
      const data = await res.json();
      if (data.vocabCompleted) {
        toast.success('단어 암기 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch {
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
    } catch {
      // Silent fail
    }
  }

  if (vocabulary.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 단어가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
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
          <TabsTrigger value="spelling" disabled={spellingItems.length === 0}>
            스펠링
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcard" className="mt-4">
          <NaesinFlashcardView
            key={activeSetId || 'all'}
            items={items}
            vocabulary={filteredVocabulary}
            onComplete={() => saveVocabProgress('flashcard')}
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
          />
        </TabsContent>

        <TabsContent value="spelling" className="mt-4">
          <NaesinSpellingView
            key={activeSetId || 'all'}
            items={spellingItems}
            vocabulary={filteredVocabulary}
            onComplete={(score) => saveVocabProgress('spelling', score)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
