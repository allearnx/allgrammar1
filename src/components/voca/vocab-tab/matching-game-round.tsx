'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn, shuffle } from '@/lib/utils';

export interface MatchingGameItem {
  leftLabel: string;
  rightLabel: string;
}

interface MatchingGameRoundProps {
  items: MatchingGameItem[];
  leftHeader: string;
  rightHeader: string;
  onComplete: (wrongIndices: number[]) => void;
  rightButtonClassName?: string;
  gridClassName?: string;
}

export function MatchingGameRound({
  items,
  leftHeader,
  rightHeader,
  onComplete,
  rightButtonClassName = 'text-base',
  gridClassName = 'grid-cols-2 gap-4',
}: MatchingGameRoundProps) {
  const rightItems = useMemo(
    () => shuffle(items.map((item, i) => ({ label: item.rightLabel, origIdx: i }))),
    [items],
  );

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<{ left: number; right: number } | null>(null);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [correctMatches, setCorrectMatches] = useState<Map<number, number>>(new Map());

  const handleLeftClick = useCallback((idx: number) => {
    if (matched.has(idx)) return;
    setSelectedLeft(idx);
  }, [matched]);

  const handleRightClick = useCallback((rightIdx: number) => {
    if (selectedLeft === null) return;
    const alreadyMatched = Array.from(correctMatches.values()).includes(rightIdx);
    if (alreadyMatched) return;

    if (rightItems[rightIdx].origIdx === selectedLeft) {
      setMatched((prev) => new Set(prev).add(selectedLeft));
      setCorrectMatches((prev) => new Map(prev).set(selectedLeft, rightIdx));
      setSelectedLeft(null);

      if (matched.size + 1 === items.length) {
        setTimeout(() => onComplete(Array.from(wrongIndices)), 300);
      }
    } else {
      setWrongFlash({ left: selectedLeft, right: rightIdx });
      setWrongIndices((prev) => new Set(prev).add(selectedLeft));
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
      }, 600);
    }
  }, [selectedLeft, items, rightItems, matched, wrongIndices, correctMatches, onComplete]);

  return (
    <div className={cn('grid', gridClassName)}>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground text-center mb-2">{leftHeader}</p>
        {items.map((item, idx) => (
          <Button
            key={idx}
            variant="outline"
            className={cn(
              'w-full h-12 text-base transition-all',
              matched.has(idx) && 'bg-green-50 border-green-500 text-green-700',
              selectedLeft === idx && !matched.has(idx) && 'ring-2 ring-primary',
              wrongFlash?.left === idx && 'bg-red-50 border-red-500 animate-pulse',
            )}
            onClick={() => handleLeftClick(idx)}
            disabled={matched.has(idx)}
          >
            {item.leftLabel}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground text-center mb-2">{rightHeader}</p>
        {rightItems.map((item, idx) => {
          const isMatched = Array.from(correctMatches.values()).includes(idx);
          return (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                'w-full h-12 transition-all',
                rightButtonClassName,
                isMatched && 'bg-green-50 border-green-500 text-green-700',
                wrongFlash?.right === idx && 'bg-red-50 border-red-500 animate-pulse',
              )}
              onClick={() => handleRightClick(idx)}
              disabled={isMatched}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
