'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { cn, shuffle } from '@/lib/utils';
import { ScoreBadges, ResultCard, NextButton } from '@/components/memory/shared';
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
  const items = useMemo(() => shuffle(rawItems), [rawItems]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

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
    }
    if (currentIndex === items.length - 1) {
      const finalCorrect = correct ? score.correct + 1 : score.correct;
      const pct = Math.round((finalCorrect / items.length) * 100);
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

  function handleReset() {
    setCurrentIndex(0);
    setShowResult(false);
    setIsCorrect(false);
    setAnswer('');
    setScore({ correct: 0, wrong: 0 });
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
  const finalPct = isFinished
    ? Math.round((score.correct / items.length) * 100)
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
          <ScoreBadges correct={score.correct} wrong={score.wrong} />
        </div>
      </div>

      {/* Completion view */}
      {isFinished ? (
        <div className="space-y-4">
          <ResultCard isCorrect={isCorrect} correctAnswer={item.spelling_answer || undefined} />

          <Card className={cn(
            'border',
            passed
              ? 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
              : 'border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800'
          )}>
            <CardContent className="py-4 text-center space-y-2">
              {passed ? (
                allVocabDone ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    <p className="font-medium text-green-800 dark:text-green-200">
                      단어 암기 단계 완료!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      교과서 암기로 넘어가자!
                    </p>
                    {onGoToNextStage && (
                      <Button onClick={onGoToNextStage} className="mt-2">
                        교과서 암기 시작하기
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    <p className="font-medium text-green-800 dark:text-green-200">
                      스펠링 통과!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      나머지 단계도 마무리하자
                    </p>
                  </>
                )
              ) : (
                <>
                  <Target className="h-8 w-8 text-orange-600 mx-auto" />
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    아쉽다! 목표 점수는 80점이야
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    다시 도전해봐!
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <p className={cn(
              'text-5xl font-bold',
              finalPct >= 80 ? 'text-green-600' : finalPct >= 50 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {finalPct}점
            </p>
            <p className="text-muted-foreground">
              {items.length}문제 중 {score.correct}개 정답
            </p>
          </div>

          <Button
            onClick={handleReset}
            variant={passed ? 'outline' : 'default'}
            className={cn('w-full', !passed && 'ring-2 ring-orange-400')}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            다시 풀기
          </Button>
        </div>
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
