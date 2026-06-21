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
  /** 상단 사용법 안내. null이면 숨김. */
  instruction?: string | null;
}

interface MatchInfo {
  leftIdx: number;
  rightIdx: number;
  firstTry: boolean;
}

export function MatchingGameRound({
  items,
  leftHeader,
  rightHeader,
  onComplete,
  rightButtonClassName = 'text-base',
  gridClassName = 'grid-cols-2 gap-4',
  instruction = '왼쪽을 누른 뒤 오른쪽에서 짝을 누르세요. 맞으면 같은 번호로 연결돼요.',
}: MatchingGameRoundProps) {
  const rightItems = useMemo(
    () => shuffle(items.map((item, i) => ({ label: item.rightLabel, origIdx: i }))),
    [items],
  );

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ left: number; right: number } | null>(null);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [attempted, setAttempted] = useState<Set<number>>(new Set()); // 한 번이라도 틀린 left
  const [matches, setMatches] = useState<Map<number, MatchInfo>>(new Map()); // leftIdx -> info

  const matchedRight = useMemo(() => {
    const m = new Map<number, MatchInfo>();
    for (const info of matches.values()) m.set(info.rightIdx, info);
    return m;
  }, [matches]);

  const handleLeftClick = useCallback((idx: number) => {
    if (matches.has(idx)) return;
    setSelectedLeft(idx);
  }, [matches]);

  const handleRightClick = useCallback((rightIdx: number) => {
    if (selectedLeft === null || matchedRight.has(rightIdx)) return;
    // ★텍스트로 매칭: 같은 뜻 단어가 2개 있어도 둘 다 정답 처리(불공정 방지)
    const isCorrect = items[selectedLeft].rightLabel === rightItems[rightIdx].label;
    if (isCorrect) {
      const firstTry = !attempted.has(selectedLeft);
      const newSize = matches.size + 1;
      setMatches((prev) => new Map(prev).set(selectedLeft, { leftIdx: selectedLeft, rightIdx, firstTry }));
      setSelectedLeft(null);
      if (newSize === items.length) {
        setTimeout(() => onComplete(Array.from(wrongIndices)), 450);
      }
    } else {
      setWrongFlash({ left: selectedLeft, right: rightIdx });
      setWrongIndices((prev) => new Set(prev).add(selectedLeft));
      setAttempted((prev) => new Set(prev).add(selectedLeft));
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
      }, 600);
    }
  }, [selectedLeft, items, rightItems, matches, matchedRight, wrongIndices, attempted, onComplete]);

  const allDone = matches.size === items.length;

  return (
    <div className="space-y-3">
      {instruction && !allDone && (
        <p className="text-xs text-center text-muted-foreground bg-muted/40 rounded-md py-2 px-3">
          {instruction}
        </p>
      )}
      <div className={cn('grid', gridClassName)}>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground text-center mb-2">{leftHeader}</p>
          {items.map((item, idx) => {
            const info = matches.get(idx);
            return (
              <Button
                key={idx}
                variant="outline"
                className={cn(
                  'relative w-full h-12 text-base transition-all',
                  info && (info.firstTry
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-amber-50 border-amber-500 text-amber-700'),
                  selectedLeft === idx && !info && 'ring-2 ring-primary',
                  wrongFlash?.left === idx && 'bg-red-50 border-red-500 animate-pulse',
                )}
                onClick={() => handleLeftClick(idx)}
                disabled={!!info}
              >
                {info && <PairBadge n={idx + 1} firstTry={info.firstTry} />}
                {item.leftLabel}
              </Button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground text-center mb-2">{rightHeader}</p>
          {rightItems.map((item, idx) => {
            const info = matchedRight.get(idx);
            return (
              <Button
                key={idx}
                variant="outline"
                className={cn(
                  'relative w-full h-12 transition-all',
                  rightButtonClassName,
                  info && (info.firstTry
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-amber-50 border-amber-500 text-amber-700'),
                  wrongFlash?.right === idx && 'bg-red-50 border-red-500 animate-pulse',
                )}
                onClick={() => handleRightClick(idx)}
                disabled={!!info}
              >
                {info && <PairBadge n={info.leftIdx + 1} firstTry={info.firstTry} />}
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
      {allDone && wrongIndices.size > 0 && (
        <p className="text-xs text-center text-amber-600">
          노란색 {wrongIndices.size}개는 처음에 틀렸던 단어예요. 한 번 더 확인하세요.
        </p>
      )}
    </div>
  );
}

function PairBadge({ n, firstTry }: { n: number; firstTry: boolean }) {
  return (
    <span
      className={cn(
        'absolute left-1.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
        firstTry ? 'bg-green-600' : 'bg-amber-500',
      )}
    >
      {n}
    </span>
  );
}
