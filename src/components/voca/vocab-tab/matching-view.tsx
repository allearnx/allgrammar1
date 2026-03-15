'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VocaVocabulary } from '@/types/voca';

interface MatchPair {
  word: string;
  match: string;
  type: 'synonym' | 'antonym';
}

interface WrongWord {
  word: string;
  match: string;
  type: 'synonym' | 'antonym';
}

interface MatchingViewProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number, attempt: number) => void;
  onFail: (wrongWords: WrongWord[]) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPairs(vocabulary: VocaVocabulary[]): { synonymPairs: MatchPair[]; antonymPairs: MatchPair[] } {
  const synonymPairs: MatchPair[] = [];
  const antonymPairs: MatchPair[] = [];

  for (const v of vocabulary) {
    if (v.synonyms) {
      const syn = v.synonyms.split(',')[0].trim();
      if (syn) synonymPairs.push({ word: v.front_text, match: syn, type: 'synonym' });
    }
    if (v.antonyms) {
      const ant = v.antonyms.split(',')[0].trim();
      if (ant) antonymPairs.push({ word: v.front_text, match: ant, type: 'antonym' });
    }
  }

  return { synonymPairs, antonymPairs };
}

type RoundType = 'synonym' | 'antonym';

export function MatchingView({ vocabulary, onComplete, onFail }: MatchingViewProps) {
  const { synonymPairs, antonymPairs } = useMemo(() => buildPairs(vocabulary), [vocabulary]);

  const allPairs = useMemo(() => {
    const pairs: MatchPair[] = [];
    if (synonymPairs.length >= 2) pairs.push(...synonymPairs.slice(0, 5));
    if (antonymPairs.length >= 2) pairs.push(...antonymPairs.slice(0, 5));
    return pairs;
  }, [synonymPairs, antonymPairs]);

  // Determine rounds
  const rounds = useMemo(() => {
    const r: RoundType[] = [];
    if (synonymPairs.length >= 2) r.push('synonym');
    if (antonymPairs.length >= 2) r.push('antonym');
    return r;
  }, [synonymPairs, antonymPairs]);

  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [allWrong, setAllWrong] = useState<WrongWord[]>([]);

  const currentRound = rounds[currentRoundIdx] || 'synonym';

  const roundPairs = useMemo(() => {
    const source = currentRound === 'synonym' ? synonymPairs : antonymPairs;
    return shuffle(source).slice(0, 5);
  }, [currentRound, synonymPairs, antonymPairs, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (allPairs.length < 2) {
    return (
      <p className="text-center text-muted-foreground py-8">
        유의어/반의어가 등록된 단어가 부족합니다. (최소 2쌍 필요)
      </p>
    );
  }

  function handleRoundComplete(score: number, wrongWords: WrongWord[]) {
    const newAllWrong = [...allWrong, ...wrongWords];
    setAllWrong(newAllWrong);

    if (currentRoundIdx < rounds.length - 1) {
      // Move to next round
      setCurrentRoundIdx(currentRoundIdx + 1);
      return;
    }

    // All rounds done - calculate total score
    const totalPairs = allPairs.length;
    const totalWrong = newAllWrong.length;
    const totalScore = Math.round(((totalPairs - totalWrong) / totalPairs) * 100);

    if (totalScore >= 90) {
      onComplete(totalScore, attempt);
    } else if (attempt === 1) {
      // 1차 실패 → 2차
      setAttempt(2);
      setCurrentRoundIdx(0);
      setAllWrong([]);
    } else {
      // 2차 실패 → 오답 5번 쓰기
      onFail(newAllWrong);
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {attempt}차 시도 · {currentRound === 'synonym' ? '유의어' : '반의어'} 매칭
        </span>
        {rounds.length > 1 && (
          <span className="text-xs text-muted-foreground">
            라운드 {currentRoundIdx + 1}/{rounds.length}
          </span>
        )}
      </div>

      <MatchRound
        key={`${currentRound}-${attempt}`}
        pairs={roundPairs}
        roundType={currentRound}
        onComplete={handleRoundComplete}
      />
    </div>
  );
}

function MatchRound({
  pairs,
  roundType,
  onComplete,
}: {
  pairs: MatchPair[];
  roundType: RoundType;
  onComplete: (score: number, wrongWords: WrongWord[]) => void;
}) {
  const leftItems = pairs.map((p) => p.word);
  const rightItems = useMemo(() => shuffle(pairs.map((p) => p.match)), [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<{ left: number; right: number } | null>(null);
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  const [correctMatches, setCorrectMatches] = useState<Map<number, number>>(new Map());

  const handleLeftClick = useCallback((idx: number) => {
    if (matched.has(idx)) return;
    setSelectedLeft(idx);
  }, [matched]);

  const handleRightClick = useCallback((rightIdx: number) => {
    if (selectedLeft === null) return;
    // Check if this right item is already matched
    const alreadyMatched = Array.from(correctMatches.values()).includes(rightIdx);
    if (alreadyMatched) return;

    const pair = pairs[selectedLeft];
    const selectedMatch = rightItems[rightIdx];

    if (pair.match === selectedMatch) {
      // Correct
      setMatched((prev) => new Set(prev).add(selectedLeft));
      setCorrectMatches((prev) => new Map(prev).set(selectedLeft, rightIdx));
      setSelectedLeft(null);

      // Check if all matched
      if (matched.size + 1 === pairs.length) {
        const score = Math.round(((pairs.length - wrongWords.length) / pairs.length) * 100);
        setTimeout(() => onComplete(score, wrongWords), 300);
      }
    } else {
      // Wrong
      setWrongFlash({ left: selectedLeft, right: rightIdx });
      setWrongWords((prev) => {
        // Only add if not already tracked for this word
        if (!prev.find((w) => w.word === pair.word)) {
          return [...prev, { word: pair.word, match: pair.match, type: roundType }];
        }
        return prev;
      });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
      }, 600);
    }
  }, [selectedLeft, pairs, rightItems, matched, wrongWords, correctMatches, onComplete, roundType]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground text-center mb-2">단어</p>
        {leftItems.map((word, idx) => (
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
            {word}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground text-center mb-2">
          {roundType === 'synonym' ? '유의어' : '반의어'}
        </p>
        {rightItems.map((word, idx) => {
          const isMatched = Array.from(correctMatches.values()).includes(idx);
          return (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                'w-full h-12 text-base transition-all',
                isMatched && 'bg-green-50 border-green-500 text-green-700',
                wrongFlash?.right === idx && 'bg-red-50 border-red-500 animate-pulse',
              )}
              onClick={() => handleRightClick(idx)}
              disabled={isMatched}
            >
              {word}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
