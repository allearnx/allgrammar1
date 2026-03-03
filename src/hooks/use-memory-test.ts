'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { MemoryItem, StudentMemoryProgress } from '@/types/database';

type TestType = 'spelling' | 'quiz';

export type MemoryTestItem = MemoryItem & { progress: StudentMemoryProgress | null };

export function useMemoryTest(items: MemoryTestItem[], testType: TestType, completionLabel: string) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const item = items[currentIndex];
  const isFinished = currentIndex === items.length - 1 && showResult;

  const submitAnswer = useCallback(async (memoryItemId: string, correct: boolean) => {
    await fetch('/api/memory/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memoryItemId,
        testType,
        isCorrect: correct,
      }),
    });
  }, [testType]);

  function recordResult(correct: boolean) {
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    }
    submitAnswer(item.id, correct);
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      toast.success(`${completionLabel} 완료! ${score.correct}/${items.length} 정답`);
    }
  }

  function resetTest() {
    setCurrentIndex(0);
    setShowResult(false);
    setIsCorrect(false);
    setScore({ correct: 0, wrong: 0 });
  }

  return {
    item,
    currentIndex,
    showResult,
    isCorrect,
    score,
    isFinished,
    recordResult,
    handleNext,
    resetTest,
  };
}
