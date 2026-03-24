'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Round2FlashcardView } from './round2-flashcard-view';
import { ComprehensiveQuiz } from './comprehensive-quiz';
import { MatchingView } from './matching-view';
import { WriteWrongWords } from './write-wrong-words';
import type { VocaVocabulary, VocaStudentProgress, VocaWrongWord } from '@/types/voca';

interface VocaTab2Props {
  vocabulary: VocaVocabulary[];
  dayId: string;
  progress: VocaStudentProgress | null;
}

export function VocaTab2({ vocabulary, dayId, progress }: VocaTab2Props) {
  const [activeTab, setActiveTab] = useState('flashcard');
  const [matchingWrongWords, setMatchingWrongWords] = useState<VocaWrongWord[] | null>(null);
  const [localProgress, setLocalProgress] = useState(progress);
  const [quizWrongWords, setQuizWrongWords] = useState<string[]>([]);

  // 완료 상태 계산
  const fc2Done = localProgress?.round2_flashcard_completed || (localProgress?.round2_quiz_score ?? 0) >= 80;
  const quiz2Score = localProgress?.round2_quiz_score ?? null;
  const quiz2Pass = (quiz2Score ?? 0) >= 80;
  const match2Done = localProgress?.round2_matching_completed ?? false;

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
      setLocalProgress((prev) => {
        const base = prev ?? {} as VocaStudentProgress;
        if (type === 'flashcard') return { ...base, round2_flashcard_completed: true };
        if (type === 'quiz') return { ...base, round2_quiz_score: score ?? 0 };
        if (type === 'matching') return { ...base, round2_matching_completed: (score ?? 0) >= 90 };
        return base;
      });
    } catch (err) {
      logger.error('voca.round2', { error: err instanceof Error ? err.message : String(err) });
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  function handleMatchingComplete(score: number, attempt: number) {
    saveProgress('matching', score, attempt);
    toast.success(`매칭 완료! ${score}점`);
  }

  function handleMatchingFail(wrongWords: VocaWrongWord[]) {
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
        <TabsTrigger value="flashcard">
          플래시카드{fc2Done && <span className="ml-1 text-green-600">✓</span>}
        </TabsTrigger>
        <TabsTrigger value="quiz">
          종합 문제{quiz2Score != null && <span className={`ml-1 ${quiz2Pass ? 'text-green-600' : 'text-orange-500'}`}>{quiz2Score}점</span>}
        </TabsTrigger>
        <TabsTrigger value="matching" disabled={!hasSynAnt}>
          매칭{match2Done && <span className="ml-1 text-green-600">✓</span>}
        </TabsTrigger>
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
          onComplete={(score, wrongWords) => {
            saveProgress('quiz', score);
            setQuizWrongWords(wrongWords || []);
          }}
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
            priorityWords={quizWrongWords}
            onComplete={handleMatchingComplete}
            onFail={handleMatchingFail}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
