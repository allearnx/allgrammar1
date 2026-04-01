'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface ReviewItem {
  id: string;
  memory_item_id: string;
  repetition_count: number;
  memory_item: {
    id: string;
    front_text: string;
    back_text: string;
    spelling_answer: string | null;
    spelling_hint: string | null;
    grammar: { title: string } | null;
  } | null;
}

interface ReviewClientProps {
  items: ReviewItem[];
}

export function ReviewClient({ items }: ReviewClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">복습할 항목이 없습니다</h3>
        <p className="text-muted-foreground mb-4">
          새로운 문법을 학습하면 복습 항목이 추가됩니다.
        </p>
        <Button asChild>
          <Link href="/student/levels">학습하러 가기</Link>
        </Button>
      </div>
    );
  }

  const item = items[currentIndex];
  const memoryItem = item?.memory_item;
  const isFinished = currentIndex === items.length - 1 && showResult;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || showResult || !memoryItem) return;

    const expectedAnswer = memoryItem.spelling_answer || memoryItem.back_text;
    const correct = answer.trim().toLowerCase() === expectedAnswer.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    }

    fetchWithToast('/api/memory/progress', {
      body: {
        memoryItemId: memoryItem.id,
        testType: 'spelling',
        isCorrect: correct,
      },
      silent: true,
    }).catch(() => { /* swallow */ });
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    }
  }

  if (!memoryItem) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {items.length} 복습
        </span>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />{score.correct}
          </Badge>
          <Badge variant="outline" className="text-red-600">
            <XCircle className="h-3 w-3 mr-1" />{score.wrong}
          </Badge>
        </div>
      </div>

      {memoryItem.grammar && (
        <Badge variant="secondary">{memoryItem.grammar.title}</Badge>
      )}

      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">뜻</p>
          <p className="text-lg font-medium">
            {memoryItem.spelling_hint || memoryItem.front_text}
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="영어를 입력하세요"
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
                    정답: <strong>{memoryItem.spelling_answer || memoryItem.back_text}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="text-center">
            {isFinished ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold">
                  복습 완료! {score.correct}/{items.length} 정답
                </p>
                <Button asChild>
                  <Link href="/student">대시보드로 돌아가기</Link>
                </Button>
              </div>
            ) : (
              <Button onClick={handleNext}>
                다음 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
