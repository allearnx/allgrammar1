'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { MemoryItem, StudentMemoryProgress, NaesinVocabulary } from '@/types/database';

type FlashcardItem = MemoryItem & { progress: StudentMemoryProgress | null };

export function NaesinFlashcardView({ items, vocabulary, onComplete }: { items: FlashcardItem[]; vocabulary: NaesinVocabulary[]; onComplete: () => void }) {
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
            minHeight: '220px',
          }}
        >
          <Card
            className="absolute inset-0 flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="text-center py-12 px-6">
              <p className="text-3xl font-medium">{item.front_text}</p>
              <p className="text-sm text-muted-foreground mt-4">탭하여 뒤집기</p>
            </CardContent>
          </Card>

          <Card
            className="absolute inset-0 flex items-center justify-center bg-primary/5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardContent className="text-center py-8 px-6">
              {vocab?.part_of_speech && (
                <p className="text-lg text-muted-foreground mb-1">{vocab.part_of_speech}</p>
              )}
              <p className="text-3xl font-medium">{item.back_text}</p>
              {(vocab?.synonyms || vocab?.antonyms) && (
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-lg">
                  {vocab.synonyms && (
                    <span className="text-blue-600">= {vocab.synonyms}</span>
                  )}
                  {vocab.antonyms && (
                    <span className="text-red-500">&harr; {vocab.antonyms}</span>
                  )}
                </div>
              )}
              {vocab?.example_sentence && (
                <p className="text-lg text-muted-foreground mt-4 italic">
                  &ldquo;{vocab.example_sentence}&rdquo;
                </p>
              )}
            </CardContent>
          </Card>
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
