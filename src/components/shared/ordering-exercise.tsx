'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Shuffle, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { TextbookPassage, SentenceItem } from '@/types/database';

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface OrderingExerciseProps {
  passage: TextbookPassage;
  onComplete: (score: number) => void;
  sortableGroup?: string;
}

interface WordItem {
  word: string;
  originalIndex: number;
}

export function OrderingExercise({ passage, onComplete }: OrderingExerciseProps) {
  const sentences = (passage.sentences || []) as SentenceItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const sentence = sentences[currentIndex];

  // Word bank (shuffled) and selected words
  const [bank, setBank] = useState<WordItem[]>(() =>
    sentence ? shuffleArray(sentence.words.map((w, i) => ({ word: w, originalIndex: i }))) : []
  );
  const [selected, setSelected] = useState<WordItem[]>([]);

  // Tap word from bank → add to selected
  const selectWord = useCallback((item: WordItem) => {
    if (showResult) return;
    setBank((prev) => prev.filter((w) => w !== item));
    setSelected((prev) => [...prev, item]);
  }, [showResult]);

  // Tap word from selected → return to bank
  const deselectWord = useCallback((item: WordItem) => {
    if (showResult) return;
    setSelected((prev) => prev.filter((w) => w !== item));
    setBank((prev) => [...prev, item]);
  }, [showResult]);

  // Undo last selected
  function handleUndo() {
    if (selected.length === 0 || showResult) return;
    const last = selected[selected.length - 1];
    setSelected((prev) => prev.slice(0, -1));
    setBank((prev) => [...prev, last]);
  }

  function handleCheck() {
    if (!sentence || selected.length !== sentence.words.length) return;
    const correct = selected.every((item, i) => item.originalIndex === i);
    setIsCorrect(correct);
    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }

  function handleNext() {
    if (currentIndex < sentences.length - 1) {
      const nextSentence = sentences[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setBank(shuffleArray(nextSentence.words.map((w, i) => ({ word: w, originalIndex: i }))));
      setSelected([]);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      const finalScore = Math.round((score.correct / sentences.length) * 100);
      onComplete(finalScore);
      toast.success(`순서 배열 완료! ${score.correct}/${sentences.length} 정답`);
    }
  }

  function handleShuffle() {
    if (!sentence || showResult) return;
    // Return all selected words to bank and reshuffle
    const allWords = sentence.words.map((w, i) => ({ word: w, originalIndex: i }));
    setBank(shuffleArray(allWords));
    setSelected([]);
  }

  if (sentences.length === 0) {
    return <p className="text-center text-muted-foreground py-4">순서 배열 문제가 없습니다.</p>;
  }

  if (!sentence) return null;

  const allPlaced = selected.length === sentence.words.length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {sentences.length}</span>
        {score.total > 0 && (
          <Badge variant="secondary">{score.correct}/{score.total} 정답</Badge>
        )}
      </div>

      {/* Korean hint */}
      <Card>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">한국어 뜻</p>
          <p className="text-base font-medium">{sentence.korean}</p>
        </CardContent>
      </Card>

      {/* Answer area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">내 답:</p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleUndo}
              disabled={selected.length === 0 || showResult}
            >
              <Undo2 className="h-3 w-3 mr-1" />되돌리기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleShuffle}
              disabled={showResult}
            >
              <Shuffle className="h-3 w-3 mr-1" />초기화
            </Button>
          </div>
        </div>
        <div
          className={cn(
            'min-h-[3.5rem] rounded-lg border-2 border-dashed p-2 flex flex-wrap gap-1.5 items-start transition-colors',
            selected.length === 0
              ? 'border-muted-foreground/20 bg-muted/30'
              : showResult && isCorrect
                ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                : showResult && !isCorrect
                  ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
                  : 'border-primary/30 bg-primary/5'
          )}
        >
          {selected.length === 0 && (
            <p className="text-xs text-muted-foreground m-auto">아래 단어를 탭하여 순서대로 배열하세요</p>
          )}
          {selected.map((item, idx) => (
            <button
              key={`s-${item.originalIndex}-${idx}`}
              type="button"
              onClick={() => deselectWord(item)}
              disabled={showResult}
              className={cn(
                'inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium transition-all',
                showResult
                  ? isCorrect
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                    : item.originalIndex === idx
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 active:scale-95 cursor-pointer'
              )}
            >
              {item.word}
            </button>
          ))}
        </div>
      </div>

      {/* Word bank */}
      {bank.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">단어 선택:</p>
          <div className="flex flex-wrap gap-1.5">
            {bank.map((item, idx) => (
              <button
                key={`b-${item.originalIndex}-${idx}`}
                type="button"
                onClick={() => selectWord(item)}
                disabled={showResult}
                className={cn(
                  'inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-medium transition-all',
                  'bg-card hover:bg-muted active:scale-95 cursor-pointer border-border shadow-sm'
                )}
              >
                {item.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2.5',
          isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
        )}>
          {isCorrect ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">정답!</span>
            </>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">오답</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 pl-6">
                정답: {sentence.original}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action button */}
      {!showResult ? (
        <Button onClick={handleCheck} className="w-full" disabled={!allPlaced}>
          확인 ({selected.length}/{sentence.words.length})
        </Button>
      ) : (
        <Button onClick={handleNext} className="w-full">
          {currentIndex < sentences.length - 1 ? '다음 문장' : '완료'}
        </Button>
      )}
    </div>
  );
}
