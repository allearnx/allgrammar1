'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemoryTest, type MemoryTestItem } from '@/hooks/use-memory-test';
import { ScoreBadges, ResultCard, CompletionView, NextButton } from './shared';

interface SpellingViewProps {
  items: MemoryTestItem[];
}

export function SpellingView({ items }: SpellingViewProps) {
  const [answer, setAnswer] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const {
    item,
    currentIndex,
    showResult,
    isCorrect,
    score,
    isFinished,
    recordResult,
    handleNext,
    resetTest,
  } = useMemoryTest(items, 'spelling', '스펠링 테스트');

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentIndex]);

  useEffect(() => {
    if (showResult) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showResult]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || showResult) return;
    const correct = answer.trim().toLowerCase() === item.spelling_answer?.toLowerCase();
    recordResult(correct);
  }

  function handleNextAndReset() {
    handleNext();
    setAnswer('');
  }

  function handleFullReset() {
    resetTest();
    setAnswer('');
  }

  if (!item) return null;

  return (
    <div ref={containerRef} className="space-y-6 scroll-mt-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {items.length}
        </span>
        <ScoreBadges correct={score.correct} wrong={score.wrong} />
      </div>

      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">힌트</p>
          <p className="text-lg font-medium">
            {item.spelling_hint || item.back_text}
          </p>
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
            {isFinished ? (
              <CompletionView
                label="스펠링 테스트"
                correct={score.correct}
                total={items.length}
                onReset={handleFullReset}
              />
            ) : (
              <NextButton onClick={handleNextAndReset} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
