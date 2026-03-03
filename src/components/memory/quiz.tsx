'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemoryTest, type MemoryTestItem } from '@/hooks/use-memory-test';
import { ScoreBadges, CompletionView, NextButton } from './shared';

interface QuizViewProps {
  items: MemoryTestItem[];
}

export function QuizView({ items }: QuizViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const {
    item,
    currentIndex,
    showResult,
    score,
    isFinished,
    recordResult,
    handleNext,
    resetTest,
  } = useMemoryTest(items, 'quiz', '퀴즈');

  function handleSelect(optionIndex: number) {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    recordResult(optionIndex === item.quiz_correct_index);
  }

  function handleNextAndReset() {
    handleNext();
    setSelectedAnswer(null);
  }

  function handleFullReset() {
    resetTest();
    setSelectedAnswer(null);
  }

  if (!item || !item.quiz_options) return null;

  const options = item.quiz_options as string[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {items.length}
        </span>
        <ScoreBadges correct={score.correct} wrong={score.wrong} />
      </div>

      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-lg font-medium">{item.front_text}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrectOption = idx === item.quiz_correct_index;

          return (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                'h-auto py-3 px-4 text-left justify-start whitespace-normal',
                showResult && isCorrectOption && 'border-green-500 bg-green-50 text-green-700',
                showResult && isSelected && !isCorrectOption && 'border-red-500 bg-red-50 text-red-700'
              )}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
            >
              <span className="mr-3 shrink-0 font-medium">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
              {showResult && isCorrectOption && (
                <CheckCircle className="h-4 w-4 ml-auto shrink-0 text-green-500" />
              )}
              {showResult && isSelected && !isCorrectOption && (
                <XCircle className="h-4 w-4 ml-auto shrink-0 text-red-500" />
              )}
            </Button>
          );
        })}
      </div>

      {showResult && (
        <div className="text-center">
          {isFinished ? (
            <CompletionView
              label="퀴즈"
              correct={score.correct}
              total={items.length}
              onReset={handleFullReset}
            />
          ) : (
            <NextButton onClick={handleNextAndReset} />
          )}
        </div>
      )}
    </div>
  );
}
