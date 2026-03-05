'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreBadges, ResultCard, CompletionView, NextButton } from '@/components/memory/shared';
import type { MemoryItem, StudentMemoryProgress, NaesinVocabulary } from '@/types/database';

type FlashcardItem = MemoryItem & { progress: StudentMemoryProgress | null };

export function NaesinSpellingView({ items, vocabulary, onComplete }: { items: FlashcardItem[]; vocabulary: NaesinVocabulary[]; onComplete: (score: number) => void }) {
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

  if (!item) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {items.length}</span>
        <ScoreBadges correct={score.correct} wrong={score.wrong} />
      </div>

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
        <div className="space-y-4">
          <ResultCard isCorrect={isCorrect} correctAnswer={item.spelling_answer || undefined} />
          <div className="text-center">
            {isFinished ? (
              <CompletionView label="스펠링 테스트" correct={score.correct} total={items.length} onReset={handleReset} />
            ) : (
              <NextButton onClick={handleNext} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
