'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Round2FlashcardView } from './round2-flashcard-view';
import { ComprehensiveQuiz } from './comprehensive-quiz';
import { MatchingView } from './matching-view';
import { WriteWrongWords } from './write-wrong-words';
import type { VocaVocabulary, VocaStudentProgress } from '@/types/voca';

interface WrongWord {
  word: string;
  match: string;
  type: 'synonym' | 'antonym';
}

interface VocaTab2Props {
  vocabulary: VocaVocabulary[];
  dayId: string;
  progress: VocaStudentProgress | null;
}

export function VocaTab2({ vocabulary, dayId, progress }: VocaTab2Props) {
  const [activeTab, setActiveTab] = useState('flashcard');
  const [matchingWrongWords, setMatchingWrongWords] = useState<WrongWord[] | null>(null);

  const hasRound2Content = useMemo(() => {
    return vocabulary.some(
      (v) => v.synonyms || v.antonyms || (v.idioms && v.idioms.length > 0)
    );
  }, [vocabulary]);

  const hasSynAnt = useMemo(() => {
    let synCount = 0;
    let antCount = 0;
    for (const v of vocabulary) {
      if (v.synonyms) synCount++;
      if (v.antonyms) antCount++;
    }
    return synCount >= 2 || antCount >= 2;
  }, [vocabulary]);

  async function saveProgress(type: 'flashcard' | 'quiz' | 'matching', score?: number, matchingAttempt?: number) {
    try {
      await fetch('/api/voca/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, type, score, matchingAttempt, round: '2' }),
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

  if (vocabulary.length === 0 || !hasRound2Content) {
    return (
      <p className="text-center text-muted-foreground py-8">
        2회독 학습 데이터가 없습니다. (유의어/반의어/숙어 필요)
      </p>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="flashcard">플래시카드</TabsTrigger>
        <TabsTrigger value="quiz">종합 문제</TabsTrigger>
        <TabsTrigger value="matching" disabled={!hasSynAnt}>매칭</TabsTrigger>
      </TabsList>

      <TabsContent value="flashcard" className="mt-4">
        <Round2FlashcardView
          vocabulary={vocabulary}
          onComplete={() => saveProgress('flashcard')}
        />
      </TabsContent>

      <TabsContent value="quiz" className="mt-4">
        <ComprehensiveQuiz
          vocabulary={vocabulary}
          dayId={dayId}
          onComplete={(score) => saveProgress('quiz', score)}
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
