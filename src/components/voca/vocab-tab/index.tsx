'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { vocaToMemoryItem, vocaToNaesinVocabulary } from '@/lib/voca/adapters';
import { NaesinFlashcardView } from '@/components/naesin/vocab-tab/flashcard-view';
import { NaesinQuizView } from '@/components/naesin/vocab-tab/quiz-view';
import { NaesinSpellingView } from '@/components/naesin/vocab-tab/spelling-view';
import { SentenceMatch } from './sentence-match';
import { WriteWrongWords } from './write-wrong-words';
import { WrongWordsSpelling } from './wrong-words-spelling';
import type { VocaVocabulary, VocaStudentProgress, VocaWrongWord } from '@/types/voca';
import type { WrongWordItem } from '@/app/(dashboard)/student/voca/[dayId]/client';

interface VocaTabProps {
  vocabulary: VocaVocabulary[];
  dayId: string;
  progress: VocaStudentProgress | null;
  wrongWords?: WrongWordItem[];
}

export function VocaTab({ vocabulary, dayId, progress, wrongWords = [] }: VocaTabProps) {
  const [activeTab, setActiveTab] = useState('flashcard');
  const [matchingWrongWords, setMatchingWrongWords] = useState<VocaWrongWord[] | null>(null);
  const [localProgress, setLocalProgress] = useState(progress);

  const items = useMemo(() => vocabulary.map(vocaToMemoryItem), [vocabulary]);
  const naesinVocab = useMemo(() => vocabulary.map(vocaToNaesinVocabulary), [vocabulary]);
  const hasEnoughForQuiz = vocabulary.length >= 4;
  const spellingItems = useMemo(() => items.filter((i) => i.spelling_answer), [items]);

  // 완료 상태 계산
  const fcDone = localProgress?.flashcard_completed || (localProgress?.quiz_score ?? 0) >= 80;
  const quizScore = localProgress?.quiz_score ?? null;
  const quizPass = (quizScore ?? 0) >= 80;
  const spellScore = localProgress?.spelling_score ?? null;
  const spellPass = (spellScore ?? 0) >= 80;
  const matchDone = localProgress?.matching_completed ?? false;

  const hasWrongWords = wrongWords.length > 0;

  const hasExampleSentences = useMemo(() => {
    return vocabulary.filter((v) => v.example_sentence).length >= 2;
  }, [vocabulary]);

  async function saveProgress(type: 'flashcard' | 'quiz' | 'spelling' | 'matching', score?: number, matchingAttempt?: number) {
    try {
      await fetchWithToast('/api/voca/progress', {
        body: { dayId, type, score, matchingAttempt },
        silent: true,
      });
    } catch { /* swallow */ }
    // 로컬 상태 업데이트
    setLocalProgress((prev) => {
      const base = prev ?? {} as VocaStudentProgress;
      if (type === 'flashcard') return { ...base, flashcard_completed: true };
      if (type === 'quiz') return { ...base, quiz_score: score ?? 0 };
      if (type === 'spelling') return { ...base, spelling_score: score ?? 0 };
      if (type === 'matching') return { ...base, matching_completed: (score ?? 0) >= 90 };
      return base;
    });
  }

  function handleMatchingComplete(score: number, attempt: number) {
    saveProgress('matching', score, attempt);
    toast.success(`매칭 완료! ${score}점`);
  }

  function handleMatchingFail(wrongWords: VocaWrongWord[]) {
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
      <TabsList className={cn('grid w-full', hasWrongWords ? 'grid-cols-5' : 'grid-cols-4')}>
        <TabsTrigger value="flashcard">
          플래시카드{fcDone && <span className="ml-1 text-green-600">✓</span>}
        </TabsTrigger>
        <TabsTrigger value="quiz" disabled={!hasEnoughForQuiz}>
          퀴즈{quizScore != null && <span className={`ml-1 ${quizPass ? 'text-green-600' : 'text-orange-500'}`}>{quizScore}점</span>}
        </TabsTrigger>
        <TabsTrigger value="spelling" disabled={spellingItems.length === 0}>
          스펠링{spellScore != null && <span className={`ml-1 ${spellPass ? 'text-green-600' : 'text-orange-500'}`}>{spellScore}점</span>}
        </TabsTrigger>
        <TabsTrigger value="matching" disabled={!hasExampleSentences}>
          매칭{matchDone && <span className="ml-1 text-green-600">✓</span>}
        </TabsTrigger>
        {hasWrongWords && (
          <TabsTrigger value="wrong-words" className="text-red-600">
            오답
          </TabsTrigger>
        )}
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
          quizResultEndpoint="/api/voca/quiz-result"
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
          <SentenceMatch
            vocabulary={vocabulary}
            onComplete={handleMatchingComplete}
            onFail={handleMatchingFail}
          />
        )}
      </TabsContent>

      {hasWrongWords && (
        <TabsContent value="wrong-words" className="mt-4">
          <WrongWordsSpelling words={wrongWords} />
        </TabsContent>
      )}
    </Tabs>
  );
}
