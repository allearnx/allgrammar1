'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { vocaToMemoryItem, vocaToNaesinVocabulary } from '@/lib/voca/adapters';
import { NaesinFlashcardView } from '@/components/naesin/vocab-tab/flashcard-view';
import { NaesinQuizView } from '@/components/naesin/vocab-tab/quiz-view';
import { NaesinSpellingView } from '@/components/naesin/vocab-tab/spelling-view';
import { MatchingView } from './matching-view';
import { WriteWrongWords } from './write-wrong-words';
import type { VocaVocabulary, VocaStudentProgress } from '@/types/voca';

interface WrongWord {
  word: string;
  match: string;
  type: 'synonym' | 'antonym';
}

interface VocaTabProps {
  vocabulary: VocaVocabulary[];
  dayId: string;
  progress: VocaStudentProgress | null;
}

export function VocaTab({ vocabulary, dayId, progress }: VocaTabProps) {
  const [activeTab, setActiveTab] = useState('flashcard');
  const [matchingWrongWords, setMatchingWrongWords] = useState<WrongWord[] | null>(null);

  const items = useMemo(() => vocabulary.map(vocaToMemoryItem), [vocabulary]);
  const naesinVocab = useMemo(() => vocabulary.map(vocaToNaesinVocabulary), [vocabulary]);
  const hasEnoughForQuiz = vocabulary.length >= 4;
  const spellingItems = useMemo(() => items.filter((i) => i.spelling_answer), [items]);

  // Check if synonyms/antonyms exist for matching tab
  const hasSynAnt = useMemo(() => {
    let synCount = 0;
    let antCount = 0;
    for (const v of vocabulary) {
      if (v.synonyms) synCount++;
      if (v.antonyms) antCount++;
    }
    return synCount >= 2 || antCount >= 2;
  }, [vocabulary]);

  async function saveProgress(type: 'flashcard' | 'quiz' | 'spelling' | 'matching', score?: number, matchingAttempt?: number) {
    try {
      await fetch('/api/voca/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, type, score, matchingAttempt }),
      });
    } catch (err) {
      console.error(err);
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  function handleMatchingComplete(score: number, attempt: number) {
    saveProgress('matching', score, attempt);
    toast.success(`매칭 완료! ${score}점`);
  }

  function handleMatchingFail(wrongWords: WrongWord[]) {
    setMatchingWrongWords(wrongWords);
    saveProgress('matching', 0, 2);
  }

  if (vocabulary.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 단어가 없습니다.
      </p>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="flashcard">플래시카드</TabsTrigger>
        <TabsTrigger value="quiz" disabled={!hasEnoughForQuiz}>퀴즈</TabsTrigger>
        <TabsTrigger value="spelling" disabled={spellingItems.length === 0}>스펠링</TabsTrigger>
        <TabsTrigger value="matching" disabled={!hasSynAnt}>매칭</TabsTrigger>
      </TabsList>

      <TabsContent value="flashcard" className="mt-4">
        <NaesinFlashcardView
          items={items}
          vocabulary={naesinVocab}
          onComplete={() => saveProgress('flashcard')}
        />
      </TabsContent>

      <TabsContent value="quiz" className="mt-4">
        <NaesinQuizView
          vocabulary={naesinVocab}
          allVocabulary={naesinVocab}
          unitId={dayId}
          onComplete={(score) => saveProgress('quiz', score)}
        />
      </TabsContent>

      <TabsContent value="spelling" className="mt-4">
        <NaesinSpellingView
          items={spellingItems}
          vocabulary={naesinVocab}
          onComplete={(score) => saveProgress('spelling', score)}
        />
      </TabsContent>

      <TabsContent value="matching" className="mt-4">
        {matchingWrongWords ? (
          <WriteWrongWords
            wrongWords={matchingWrongWords}
            dayId={dayId}
            onSubmitted={() => {
              setMatchingWrongWords(null);
              toast.success('매칭 학습이 완료되었습니다');
            }}
          />
        ) : (
          <MatchingView
            vocabulary={vocabulary}
            onComplete={handleMatchingComplete}
            onFail={handleMatchingFail}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
