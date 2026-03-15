'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoreBadges, ResultCard, NextButton } from '@/components/memory/shared';
import type { WrongWordItem } from '@/app/(dashboard)/student/voca/[dayId]/client';

export function WrongWordsSpelling({ words }: { words: WrongWordItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [wrongList, setWrongList] = useState<WrongWordItem[]>([]);

  const item = words[currentIndex];
  const isFinished = currentIndex === words.length - 1 && showResult;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || showResult) return;
    const correct = answer.trim().toLowerCase() === item.front_text.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
      setWrongList((prev) => [...prev, item]);
    }
  }

  function handleNext() {
    if (currentIndex < words.length - 1) {
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
    setWrongList([]);
  }

  if (!item) return null;

  const finalPct = isFinished
    ? Math.round((score.correct / words.length) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {words.length}
        </span>
        <ScoreBadges correct={score.correct} wrong={score.wrong} />
      </div>

      {isFinished ? (
        <div className="space-y-4">
          <ResultCard isCorrect={isCorrect} correctAnswer={item.front_text} />

          <div className="text-center space-y-2">
            <p
              className={cn(
                'text-5xl font-bold',
                finalPct >= 80
                  ? 'text-green-600'
                  : finalPct >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
              )}
            >
              {finalPct}점
            </p>
            <p className="text-muted-foreground">
              {words.length}문제 중 {score.correct}개 정답
            </p>
          </div>

          {wrongList.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                  틀린 단어 ({wrongList.length}개)
                </p>
                <ul className="space-y-2">
                  {wrongList.map((w, i) => (
                    <li
                      key={i}
                      className="flex justify-between text-sm border-b last:border-0 pb-2 last:pb-0"
                    >
                      <span className="font-medium">{w.front_text}</span>
                      <span className="text-muted-foreground">{w.back_text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleReset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            다시 풀기
          </Button>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">뜻</p>
              <p className="text-2xl font-medium">{item.back_text}</p>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="영어 단어를 입력하세요"
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
              <ResultCard isCorrect={isCorrect} correctAnswer={item.front_text} />
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
