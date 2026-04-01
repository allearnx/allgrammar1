'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { MemoryItem, StudentMemoryProgress } from '@/types/database';

interface FlashcardViewProps {
  items: (MemoryItem & { progress: StudentMemoryProgress | null })[];
}

export function FlashcardView({ items }: FlashcardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const item = items[currentIndex];

  const markSeen = useCallback(async (memoryItemId: string) => {
    try {
      await fetchWithToast('/api/memory/progress', {
        body: { memoryItemId, testType: 'flashcard', isCorrect: true },
        silent: true,
      });
    } catch { /* swallow */ }
  }, []);

  function handleFlip() {
    setFlipped(!flipped);
    if (!flipped) {
      markSeen(item.id);
    }
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    } else {
      toast.success('모든 카드를 확인했습니다!');
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
      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} / {items.length}
      </div>

      {/* 3D Flip Card */}
      <div
        className="perspective-1000 cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '200px',
          }}
        >
          {/* Front */}
          <Card
            className="absolute inset-0 flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="text-center py-12 px-6">
              <p className="text-xl font-medium">{item.front_text}</p>
              <p className="text-sm text-muted-foreground mt-4">
                탭하여 뒤집기
              </p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card
            className="absolute inset-0 flex items-center justify-center bg-primary/5"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardContent className="text-center py-12 px-6">
              <p className="text-xl font-medium">{item.back_text}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === items.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
