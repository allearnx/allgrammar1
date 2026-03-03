'use client';

import { useState, useCallback } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, GripVertical, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveProgress } from '@/hooks/use-save-progress';
import type { TextbookPassage, StudentTextbookProgress, SentenceItem } from '@/types/database';

interface OrderingViewProps {
  passage: TextbookPassage;
  progress?: StudentTextbookProgress | null;
}

function SortableWord({ id, word, index }: { id: string; word: string; index: number }) {
  const { ref, isDragging } = useSortable({ id, index, group: 'words' });

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'shadow-lg opacity-70' : ''
      }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm">{word}</span>
    </div>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function OrderingView({ passage, progress }: OrderingViewProps) {
  const { saveTextbookProgress } = useSaveProgress();
  const sentences = (passage.sentences || []) as SentenceItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const sentence = sentences[currentIndex];
  const [items, setItems] = useState<string[]>(() =>
    sentence ? shuffleArray(sentence.words) : []
  );

  const handleDragOver = useCallback((event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragOver']>>[0]) => {
    setItems((currentItems) => move(currentItems, event));
  }, []);

  function handleCheck() {
    if (!sentence) return;
    const userSentence = items.join(' ');
    const originalWords = sentence.original.split(/\s+/);
    const correct = items.join(' ') === originalWords.join(' ');

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
      setItems(shuffleArray(nextSentence.words));
      setShowResult(false);
      setIsCorrect(false);
    } else {
      const finalScore = Math.round((score.correct / sentences.length) * 100);
      saveTextbookProgress(passage.id, 'ordering', finalScore);
      toast.success(`순서 배열 완료! ${score.correct}/${sentences.length} 정답`);
    }
  }

  function handleShuffle() {
    if (sentence) {
      setItems(shuffleArray(sentence.words));
    }
  }

  if (sentences.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        순서 배열 문제가 없습니다.
      </p>
    );
  }

  if (!sentence) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {sentences.length}
        </span>
        <Badge variant="secondary">
          {score.correct}/{score.total} 정답
        </Badge>
      </div>

      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">한국어 뜻</p>
          <p className="text-lg font-medium">{sentence.korean}</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">단어를 올바른 순서로 배열하세요:</p>
          <Button variant="ghost" size="sm" onClick={handleShuffle} disabled={showResult}>
            <Shuffle className="h-4 w-4 mr-1" />
            섞기
          </Button>
        </div>

        <DragDropProvider onDragOver={handleDragOver}>
          <div className="flex flex-col gap-2">
            {items.map((word, index) => (
              <SortableWord key={`${word}-${index}`} id={`${word}-${index}`} word={word} index={index} />
            ))}
          </div>
        </DragDropProvider>
      </div>

      {showResult && (
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
                <p className="text-sm">정답: {sentence.original}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {!showResult ? (
          <Button onClick={handleCheck} className="flex-1">
            확인
          </Button>
        ) : (
          <Button onClick={handleNext} className="flex-1">
            {currentIndex < sentences.length - 1 ? '다음 문장' : '완료'}
          </Button>
        )}
      </div>
    </div>
  );
}
