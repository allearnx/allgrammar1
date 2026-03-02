'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { MemoryItem, StudentMemoryProgress } from '@/types/database';

interface QuizViewProps {
  items: (MemoryItem & { progress: StudentMemoryProgress | null })[];
}

export function QuizView({ items }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const item = items[currentIndex];

  const submitAnswer = useCallback(async (memoryItemId: string, isCorrect: boolean) => {
    await fetch('/api/memory/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memoryItemId,
        testType: 'quiz',
        isCorrect,
      }),
    });
  }, []);

  function handleSelect(optionIndex: number) {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);

    const isCorrect = optionIndex === item.quiz_correct_index;
    if (isCorrect) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    }

    submitAnswer(item.id, isCorrect);
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      toast.success(`퀴즈 완료! ${score.correct}/${items.length} 정답`);
    }
  }

  if (!item || !item.quiz_options) return null;

  const options = item.quiz_options as string[];
  const isFinished = currentIndex === items.length - 1 && showResult;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {items.length}
        </span>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {score.correct}
          </Badge>
          <Badge variant="outline" className="text-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            {score.wrong}
          </Badge>
        </div>
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
            <div className="space-y-3">
              <p className="text-lg font-semibold">
                퀴즈 완료! {score.correct}/{items.length} 정답
              </p>
              <Button
                onClick={() => {
                  setCurrentIndex(0);
                  setSelectedAnswer(null);
                  setShowResult(false);
                  setScore({ correct: 0, wrong: 0 });
                }}
              >
                다시 풀기
              </Button>
            </div>
          ) : (
            <Button onClick={handleNext}>
              다음 문제
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
