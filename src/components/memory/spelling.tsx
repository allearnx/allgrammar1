'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { MemoryItem, StudentMemoryProgress } from '@/types/database';

interface SpellingViewProps {
  items: (MemoryItem & { progress: StudentMemoryProgress | null })[];
}

export function SpellingView({ items }: SpellingViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const item = items[currentIndex];

  const submitAnswer = useCallback(async (memoryItemId: string, correct: boolean) => {
    await fetch('/api/memory/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memoryItemId,
        testType: 'spelling',
        isCorrect: correct,
      }),
    });
  }, []);

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

    submitAnswer(item.id, correct);
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    } else {
      toast.success(`스펠링 테스트 완료! ${score.correct}/${items.length} 정답`);
    }
  }

  if (!item) return null;

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
        <div className="space-y-4">
          <Card className={isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
            <CardContent className="py-4 text-center">
              {isCorrect ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">정답!</span>
                </div>
              ) : (
                <div className="text-red-700">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">오답</span>
                  </div>
                  <p className="text-sm">
                    정답: <strong>{item.spelling_answer}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            {isFinished ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold">
                  스펠링 테스트 완료! {score.correct}/{items.length} 정답
                </p>
                <Button
                  onClick={() => {
                    setCurrentIndex(0);
                    setAnswer('');
                    setShowResult(false);
                    setIsCorrect(false);
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
        </div>
      )}
    </div>
  );
}
