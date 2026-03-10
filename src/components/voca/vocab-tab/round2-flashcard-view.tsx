'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VocaVocabulary, VocaIdiom } from '@/types/voca';

interface Round2FlashcardViewProps {
  vocabulary: VocaVocabulary[];
  onComplete: () => void;
}

interface CardData {
  word: string;
  front: string;
  back: string[];
}

function buildCards(vocabulary: VocaVocabulary[]): CardData[] {
  const cards: CardData[] = [];

  for (const v of vocabulary) {
    const backLines: string[] = [];

    if (v.synonyms) {
      backLines.push(`유의어: ${v.synonyms}`);
    }
    if (v.antonyms) {
      backLines.push(`반의어: ${v.antonyms}`);
    }
    if (v.idioms && v.idioms.length > 0) {
      for (const idiom of v.idioms) {
        backLines.push(`숙어: ${idiom.en} — ${idiom.ko}`);
        if (idiom.example_en) {
          backLines.push(`  예) ${idiom.example_en}`);
        }
      }
    }

    if (backLines.length > 0) {
      cards.push({
        word: v.front_text,
        front: v.front_text,
        back: backLines,
      });
    }
  }

  return cards;
}

export function Round2FlashcardView({ vocabulary, onComplete }: Round2FlashcardViewProps) {
  const cards = useMemo(() => buildCards(vocabulary), [vocabulary]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (cards.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        유의어/반의어/숙어가 등록된 단어가 없습니다.
      </p>
    );
  }

  const card = cards[currentIdx];
  const isLast = currentIdx === cards.length - 1;

  function handleNext() {
    if (isLast) {
      setCompleted(true);
      onComplete();
      return;
    }
    setFlipped(false);
    setCurrentIdx((i) => i + 1);
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setFlipped(false);
      setCurrentIdx((i) => i - 1);
    }
  }

  function handleRestart() {
    setCurrentIdx(0);
    setFlipped(false);
    setCompleted(false);
  }

  if (completed) {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-lg font-semibold">2회독 플래시카드 완료!</p>
        <p className="text-muted-foreground">{cards.length}개 단어의 유의어/반의어/숙어를 학습했습니다.</p>
        <Button variant="outline" onClick={handleRestart}>
          <RotateCcw className="h-4 w-4 mr-2" />
          다시 학습하기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{currentIdx + 1} / {cards.length}</span>
        <Badge variant="outline">2회독</Badge>
      </div>

      <Card
        className={cn(
          'cursor-pointer min-h-[200px] flex items-center justify-center transition-all border-0 shadow-lg',
          flipped
            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
            : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
        )}
        onClick={() => setFlipped(!flipped)}
      >
        <CardContent className="py-8 text-center w-full">
          {!flipped ? (
            <div>
              <p className="text-2xl font-bold">{card.front}</p>
              <p className="text-xs text-white/60 mt-2">탭하여 뒤집기</p>
            </div>
          ) : (
            <div className="space-y-2 text-left px-4">
              <p className="text-lg font-semibold text-center mb-3">{card.word}</p>
              {card.back.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    'text-sm',
                    line.startsWith('  예)') && 'text-white/70 ml-4 italic'
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIdx === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <Button size="sm" onClick={handleNext}>
          {isLast ? '완료' : '다음'}
          {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
