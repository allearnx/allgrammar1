'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, ArrowRight } from 'lucide-react';
import type { MemoryItem, StudentMemoryProgress, NaesinVocabulary } from '@/types/database';

type FlashcardItem = MemoryItem & { progress: StudentMemoryProgress | null };

export function NaesinFlashcardView({
  items,
  vocabulary,
  onComplete,
  onGoToQuiz,
}: {
  items: FlashcardItem[];
  vocabulary: NaesinVocabulary[];
  onComplete: () => void;
  onGoToQuiz?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seenAll, setSeenAll] = useState(false);

  const item = items[currentIndex];
  const vocab = vocabulary[currentIndex];

  function handleFlip() {
    setFlipped(!flipped);
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    } else if (!seenAll) {
      setSeenAll(true);
      onComplete();
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setFlipped(false);
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      {/* Completion banner */}
      {seenAll && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
          <CardContent className="py-4 flex flex-col sm:flex-row items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-medium text-green-800 dark:text-green-200">
                모든 카드를 확인했어요!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {onGoToQuiz ? '이제 퀴즈를 풀어볼까요?' : '플래시카드 학습 완료!'}
              </p>
            </div>
            {onGoToQuiz && (
              <Button onClick={onGoToQuiz} className="shrink-0">
                퀴즈 시작하기
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} / {items.length}
      </div>

      <div
        className="cursor-pointer max-w-md mx-auto"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '240px',
          }}
        >
          {/* Front — English word */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="h-1.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400" />
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
              <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{item.front_text}</p>
              <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">탭하여 뒤집기</p>
            </div>
          </div>

          {/* Back — Korean meaning */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-stone-50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="h-1.5 bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300" />
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
              {vocab?.part_of_speech && (
                <span className="mb-2 rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {vocab.part_of_speech}
                </span>
              )}
              <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{item.back_text}</p>
              {(vocab?.synonyms || vocab?.antonyms) && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {vocab.synonyms && (
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-sm font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      = {vocab.synonyms}
                    </span>
                  )}
                  {vocab.antonyms && (
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-sm font-medium text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                      &harr; {vocab.antonyms}
                    </span>
                  )}
                </div>
              )}
              {vocab?.example_sentence && (
                <p className="mt-4 text-center text-base italic text-slate-500 dark:text-slate-400">
                  &ldquo;{vocab.example_sentence}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === items.length - 1 && seenAll}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
