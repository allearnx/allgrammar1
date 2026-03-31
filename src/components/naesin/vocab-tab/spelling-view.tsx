'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, CheckCircle, ArrowRight, RotateCcw, ListRestart } from 'lucide-react';
import { cn, shuffle } from '@/lib/utils';
import { ScoreBadges, ResultCard, NextButton } from '@/components/memory/shared';
import { useRetryWrong } from '@/hooks/use-retry-wrong';
import { getEncouragement } from '@/lib/naesin/encouragement';
import type { MemoryItem, StudentMemoryProgress, NaesinVocabulary } from '@/types/database';

type FlashcardItem = MemoryItem & { progress: StudentMemoryProgress | null };

export function NaesinSpellingView({
  items: rawItems,
  vocabulary,
  onComplete,
  onGoToNextStage,
  quizScore,
}: {
  items: FlashcardItem[];
  vocabulary: NaesinVocabulary[];
  onComplete: (score: number) => void;
  onGoToNextStage?: () => void;
  quizScore?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(() => shuffle(rawItems));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [wrongItems, setWrongItems] = useState<FlashcardItem[]>([]);

  const { previousCorrectCount: retryPreviousCorrectCount, isRetrying, startRetry, reset: resetRetry, getCombinedScore } = useRetryWrong();
  const totalOriginalCount = rawItems.length;

  const item = items[currentIndex];
  const vocab = vocabulary.find((v) => v.id === item?.id);
  const isFinished = currentIndex === items.length - 1 && showResult;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || showResult) return;
    const correct = answer.trim().toLowerCase() === item.spelling_answer?.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
      setWrongItems((prev) => [...prev, item]);
    }
    if (currentIndex === items.length - 1) {
      const finalCorrect = correct ? score.correct + 1 : score.correct;
      const pct = getCombinedScore(finalCorrect, totalOriginalCount);
      onComplete(pct);
    }
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setIsCorrect(false);
      setAnswer('');
    }
  }

  function handleRetryWrong() {
    if (wrongItems.length === 0) return;
    startRetry(score.correct);
    setItems(shuffle(wrongItems));
    setCurrentIndex(0);
    setShowResult(false);
    setIsCorrect(false);
    setAnswer('');
    setScore({ correct: 0, wrong: 0 });
    setWrongItems([]);
  }

  function handleReset() {
    setItems(shuffle(rawItems));
    setCurrentIndex(0);
    setShowResult(false);
    setIsCorrect(false);
    setAnswer('');
    setScore({ correct: 0, wrong: 0 });
    setWrongItems([]);
    resetRetry();
  }

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentIndex]);

  useEffect(() => {
    if (showResult) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showResult]);

  if (!item) return null;

  // Calculate final score for completion view
  const combinedCorrect = retryPreviousCorrectCount + score.correct;
  const finalPct = isFinished
    ? getCombinedScore(score.correct, totalOriginalCount)
    : 0;
  const passed = finalPct >= 80;
  const quizPassed = quizScore !== null && quizScore !== undefined && quizScore >= 80;
  const allVocabDone = passed && quizPassed;

  return (
    <div ref={containerRef} className="space-y-6 max-w-md mx-auto scroll-mt-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {items.length}</span>
        <div className="flex items-center gap-3">
          {!isFinished && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
              <Target className="h-3 w-3" />
              목표 80점
            </span>
          )}
          <ScoreBadges correct={retryPreviousCorrectCount + score.correct} wrong={score.wrong} />
        </div>
      </div>

      {isRetrying && !isFinished && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          <ListRestart className="h-3.5 w-3.5 shrink-0" />
          틀린 {items.length}개 단어만 다시 풀어보세요
        </div>
      )}

      {/* Completion view */}
      {isFinished ? (
        <SpellingCompletionView
          isCorrect={isCorrect}
          correctAnswer={item.spelling_answer || undefined}
          passed={passed}
          allVocabDone={allVocabDone}
          finalPct={finalPct}
          totalOriginalCount={totalOriginalCount}
          combinedCorrect={combinedCorrect}
          wrongItems={wrongItems}
          onGoToNextStage={onGoToNextStage}
          onRetryWrong={handleRetryWrong}
          onReset={handleReset}
        />
      ) : (
        <>
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">힌트</p>
              <p className="text-2xl font-medium">{item.spelling_hint || item.back_text}</p>
              {vocab?.example_sentence && (
                <p className="text-base text-muted-foreground mt-3 italic">
                  &ldquo;{vocab.example_sentence.replace(
                    new RegExp(item.spelling_answer || item.front_text, 'gi'),
                    '______'
                  )}&rdquo;
                </p>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="영어 스펠링을 입력하세요"
              disabled={showResult}
              autoFocus
              className="text-center text-lg"
            />
            {!showResult && (
              <Button type="submit" className="w-full" disabled={!answer.trim()}>
                확인
              </Button>
            )}
          </form>

          {showResult && (
            <div ref={resultRef} className="space-y-4">
              <ResultCard isCorrect={isCorrect} correctAnswer={item.spelling_answer || undefined} />
              <div className="text-center">
                <NextButton onClick={handleNext} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SpellingCompletionView({
  isCorrect,
  correctAnswer,
  passed,
  allVocabDone,
  finalPct,
  totalOriginalCount,
  combinedCorrect,
  wrongItems,
  onGoToNextStage,
  onRetryWrong,
  onReset,
}: {
  isCorrect: boolean;
  correctAnswer?: string;
  passed: boolean;
  allVocabDone: boolean;
  finalPct: number;
  totalOriginalCount: number;
  combinedCorrect: number;
  wrongItems: FlashcardItem[];
  onGoToNextStage?: () => void;
  onRetryWrong: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <ResultCard isCorrect={isCorrect} correctAnswer={correctAnswer} />

      <SpellingStatusBanner
        passed={passed}
        allVocabDone={allVocabDone}
        onGoToNextStage={onGoToNextStage}
      />

      <div className="text-center space-y-2">
        <p className={cn(
          'text-5xl font-bold',
          finalPct >= 80 ? 'text-green-600' : finalPct >= 50 ? 'text-yellow-600' : 'text-red-600'
        )}>
          {finalPct}점
        </p>
        <p className="text-muted-foreground">
          {totalOriginalCount}문제 중 {combinedCorrect}개 정답
        </p>
      </div>

      {wrongItems.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="font-medium text-red-600 mb-3">틀린 단어 ({wrongItems.length}개)</p>
            <div className="space-y-2">
              {wrongItems.map((w, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                  <span className="font-medium">{w.front_text}</span>
                  <span className="text-muted-foreground text-sm">{w.spelling_answer}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {wrongItems.length > 0 && (
          <Button
            onClick={onRetryWrong}
            className={cn('w-full', !passed && 'ring-2 ring-orange-400')}
          >
            <ListRestart className="h-4 w-4 mr-2" />
            오답만 다시 풀기
          </Button>
        )}
        <Button onClick={onReset} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          전체 다시 풀기
        </Button>
      </div>
    </div>
  );
}

function SpellingStatusBanner({
  passed,
  allVocabDone,
  onGoToNextStage,
}: {
  passed: boolean;
  allVocabDone: boolean;
  onGoToNextStage?: () => void;
}) {
  if (!passed) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
        <CardContent className="py-4 text-center space-y-2">
          <Target className="h-8 w-8 text-orange-600 mx-auto" />
          <p className="font-medium text-orange-800 dark:text-orange-200">{getEncouragement(0)}</p>
          <p className="text-sm text-orange-600 dark:text-orange-400">다시 도전해봐!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
      <CardContent className="py-4 text-center space-y-2">
        <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
        <p className="font-medium text-green-800 dark:text-green-200">
          {allVocabDone ? '단어 암기 단계 완료!' : getEncouragement(100)}
        </p>
        <p className="text-sm text-green-600 dark:text-green-400">
          {allVocabDone ? '교과서 암기로 넘어가자!' : '나머지 단계도 마무리하자'}
        </p>
        {allVocabDone && onGoToNextStage && (
          <Button onClick={onGoToNextStage} className="mt-2">
            교과서 암기 시작하기
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
