'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, Trophy, RotateCcw, Info, ListRestart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRetryWrong } from '@/hooks/use-retry-wrong';
import type { GrammarVocabItem, GrammarVocabChoicePoint } from '@/types/naesin';

export interface WrongChoicePoint {
  type: 'grammar_vocab';
  itemIdx: number;
  cpIdx: number;
  correctOption: string;
  selectedOption: string;
  sentence: string;
}

interface GrammarVocabViewProps {
  items: GrammarVocabItem[];
  onScoreChange: (score: number, wrongs?: WrongChoicePoint[]) => void;
}

type SelectionMap = Record<string, number>; // key: `${itemIdx}-${cpIdx}`, value: selected option index

/** choice point 유효성 검증: 범위가 문장 단어 수 안에 있고, 서로 겹치지 않는 것만 반환 */
function getValidChoicePoints(item: GrammarVocabItem): GrammarVocabChoicePoint[] {
  const words = item.original.split(/\s+/);
  const valid: GrammarVocabChoicePoint[] = [];

  const sorted = [...item.choicePoints]
    .filter((cp) => cp.startWord >= 0 && cp.endWord < words.length && cp.startWord <= cp.endWord)
    .sort((a, b) => a.startWord - b.startWord);

  let lastEnd = -1;
  for (const cp of sorted) {
    if (cp.startWord > lastEnd) {
      const originalWords = words.slice(cp.startWord, cp.endWord + 1).join(' ');
      const correctOption = cp.options[cp.correctIndex];
      if (correctOption === originalWords) {
        valid.push(cp);
        lastEnd = cp.endWord;
      }
    }
  }
  return valid;
}

export function GrammarVocabView({ items, onScoreChange }: GrammarVocabViewProps) {
  const [selections, setSelections] = useState<SelectionMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultModal, setResultModal] = useState<{ score: number; correct: number; total: number } | null>(null);

  // Retry-wrong-only state
  const [retryMode, setRetryMode] = useState(false);
  const [lockedCorrectKeys, setLockedCorrectKeys] = useState<Set<string>>(new Set());
  const [wrongItemIndices, setWrongItemIndices] = useState<Set<number>>(new Set());
  const { previousCorrectCount, startRetry, reset: resetRetry, getCombinedScore } = useRetryWrong();

  const validCPMap = items.map((item) => getValidChoicePoints(item));
  const totalChoicePoints = validCPMap.reduce((sum, cps) => sum + cps.length, 0);

  // In retry mode, count wrongs (non-locked, wrong selections)
  const wrongCount = useMemo(() => {
    if (!submitted) return 0;
    let count = 0;
    items.forEach((_, itemIdx) => {
      validCPMap[itemIdx].forEach((cp, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (!lockedCorrectKeys.has(key) && selections[key] !== cp.correctIndex) {
          count++;
        }
      });
    });
    return count;
  }, [submitted, items, validCPMap, selections, lockedCorrectKeys]);

  function selectOption(itemIdx: number, cpIdx: number, optionIdx: number) {
    if (submitted) return;
    const key = `${itemIdx}-${cpIdx}`;
    if (lockedCorrectKeys.has(key)) return; // locked in retry mode
    setSelections((prev) => ({ ...prev, [key]: optionIdx }));
  }

  function handleSubmit() {
    let correct = 0;
    const wrongs: WrongChoicePoint[] = [];
    items.forEach((item, itemIdx) => {
      validCPMap[itemIdx].forEach((cp, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (lockedCorrectKeys.has(key)) {
          correct++; // locked = already correct
          return;
        }
        if (selections[key] === cp.correctIndex) {
          correct++;
        } else {
          wrongs.push({
            type: 'grammar_vocab',
            itemIdx,
            cpIdx,
            correctOption: cp.options[cp.correctIndex],
            selectedOption: cp.options[selections[key] ?? -1] || '',
            sentence: item.original,
          });
        }
      });
    });

    // In retry mode, combine previous correct + newly correct (excluding locked)
    const newlyCorrect = correct - lockedCorrectKeys.size;
    const totalCorrect = retryMode ? previousCorrectCount + newlyCorrect : correct;
    const score = retryMode
      ? getCombinedScore(newlyCorrect, totalChoicePoints)
      : (totalChoicePoints > 0 ? Math.round((correct / totalChoicePoints) * 100) : 0);
    setSubmitted(true);
    setResultModal({ score, correct: totalCorrect, total: totalChoicePoints });
    onScoreChange(score, wrongs);
  }

  function handleRetryWrong() {
    // Collect currently correct keys (including previously locked)
    const newLockedKeys = new Set(lockedCorrectKeys);
    let newlyCorrect = 0;
    const newWrongItems = new Set<number>();

    items.forEach((_, itemIdx) => {
      let hasWrong = false;
      validCPMap[itemIdx].forEach((cp, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (lockedCorrectKeys.has(key)) return; // already locked
        if (selections[key] === cp.correctIndex) {
          newLockedKeys.add(key);
          newlyCorrect++;
        } else {
          hasWrong = true;
        }
      });
      if (hasWrong) newWrongItems.add(itemIdx);
    });

    // Clear wrong selections, keep correct ones
    const newSelections: SelectionMap = {};
    for (const key of newLockedKeys) {
      const [itemIdxStr, cpIdxStr] = key.split('-');
      const cp = validCPMap[Number(itemIdxStr)][Number(cpIdxStr)];
      newSelections[key] = cp.correctIndex;
    }

    setLockedCorrectKeys(newLockedKeys);
    startRetry(newlyCorrect);
    setWrongItemIndices(newWrongItems);
    setSelections(newSelections);
    setSubmitted(false);
    setResultModal(null);
    setRetryMode(true);
  }

  function handleRetry() {
    setSelections({});
    setSubmitted(false);
    setResultModal(null);
    setRetryMode(false);
    setLockedCorrectKeys(new Set());
    setWrongItemIndices(new Set());
    resetRetry();
  }

  // In retry mode, only count unlocked CPs for "allSelected"
  const allSelected = useMemo(() => {
    let needed = 0;
    let filled = 0;
    items.forEach((_, itemIdx) => {
      validCPMap[itemIdx].forEach((_, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (lockedCorrectKeys.has(key)) return;
        needed++;
        if (selections[key] !== undefined) filled++;
      });
    });
    return needed > 0 && filled === needed;
  }, [items, validCPMap, selections, lockedCorrectKeys]);

  // Filter items to show in retry mode
  const visibleItems = retryMode
    ? items.map((item, idx) => ({ item, idx })).filter(({ idx }) => wrongItemIndices.has(idx))
    : items.map((item, idx) => ({ item, idx }));

  return (
    <div className="space-y-3">
      {/* Banner */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
        <Info className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          모든 시도가 기록됩니다. 문장을 읽고 올바른 표현을 선택하세요.
        </p>
      </div>

      {retryMode && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          <ListRestart className="h-3.5 w-3.5 shrink-0" />
          틀린 문제만 다시 풀어보세요 (맞은 선택지는 잠금 처리됨)
        </div>
      )}

      {/* Sentence cards */}
      {visibleItems.map(({ item, idx: itemIdx }) => (
        <SentenceCard
          key={itemIdx}
          item={item}
          itemIdx={itemIdx}
          validChoicePoints={validCPMap[itemIdx]}
          selections={selections}
          submitted={submitted}
          lockedKeys={lockedCorrectKeys}
          onSelect={selectOption}
        />
      ))}

      {/* Submit / Retry */}
      <div className="flex gap-2">
        {!submitted ? (
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!allSelected}
          >
            제출하기
          </Button>
        ) : (
          <>
            {wrongCount > 0 && (
              <Button className="flex-1" onClick={handleRetryWrong}>
                <ListRestart className="h-4 w-4 mr-1" />
                오답만 다시 풀기
              </Button>
            )}
            <Button className="flex-1" variant="outline" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4 mr-1" />
              전체 다시 풀기
            </Button>
          </>
        )}
      </div>

      {/* Result Dialog */}
      {resultModal && (
        <ResultDialog
          result={resultModal}
          wrongCount={wrongCount}
          onClose={() => setResultModal(null)}
          onRetry={handleRetry}
          onRetryWrong={handleRetryWrong}
        />
      )}
    </div>
  );
}

function SentenceCard({
  item,
  itemIdx,
  validChoicePoints,
  selections,
  submitted,
  lockedKeys,
  onSelect,
}: {
  item: GrammarVocabItem;
  itemIdx: number;
  validChoicePoints: GrammarVocabChoicePoint[];
  selections: SelectionMap;
  submitted: boolean;
  lockedKeys: Set<string>;
  onSelect: (itemIdx: number, cpIdx: number, optionIdx: number) => void;
}) {
  const words = item.original.split(/\s+/);

  const cpRanges = validChoicePoints.map((cp, cpIdx) => ({
    cpIdx,
    cp,
    startWord: cp.startWord,
    endWord: cp.endWord,
  }));

  const elements: React.ReactNode[] = [];
  let wordIdx = 0;

  while (wordIdx < words.length) {
    const range = cpRanges.find((r) => r.startWord === wordIdx);
    if (range) {
      const key = `${itemIdx}-${range.cpIdx}`;
      const selectedIdx = selections[key];
      const isLocked = lockedKeys.has(key);
      if (elements.length > 0) elements.push(' ');
      elements.push(
        <ChoicePointInline
          key={`cp-${key}`}
          cp={range.cp}
          selectedIdx={selectedIdx}
          submitted={submitted}
          locked={isLocked}
          onSelect={(optIdx) => onSelect(itemIdx, range.cpIdx, optIdx)}
        />
      );
      wordIdx = range.endWord + 1;
    } else {
      if (elements.length > 0) elements.push(' ');
      elements.push(
        <span key={`w-${wordIdx}`}>{words[wordIdx]}</span>
      );
      wordIdx++;
    }
  }

  return (
    <Card>
      <CardContent className="py-3 px-4 space-y-2">
        <p className="text-sm text-muted-foreground">{item.korean}</p>
        <p className="text-base leading-relaxed">
          {elements}
        </p>
      </CardContent>
    </Card>
  );
}

function ChoicePointInline({
  cp,
  selectedIdx,
  submitted,
  locked,
  onSelect,
}: {
  cp: GrammarVocabChoicePoint;
  selectedIdx: number | undefined;
  submitted: boolean;
  locked: boolean;
  onSelect: (optIdx: number) => void;
}) {
  // Locked: show only the correct answer in green, no interaction
  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 mx-1">
        <span className="px-2 py-0.5 rounded text-sm font-medium bg-green-100 dark:bg-green-900/40 border border-green-400 text-green-800 dark:text-green-200">
          {cp.options[cp.correctIndex]}
        </span>
        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 mx-1">
      <span className="text-muted-foreground">[</span>
      {cp.options.map((opt, optIdx) => {
        const isSelected = selectedIdx === optIdx;
        const isCorrect = optIdx === cp.correctIndex;

        let className = 'px-2 py-0.5 rounded text-sm font-medium transition-colors cursor-pointer border ';

        if (submitted) {
          if (isCorrect) {
            className += 'bg-green-100 dark:bg-green-900/40 border-green-400 text-green-800 dark:text-green-200';
          } else if (isSelected && !isCorrect) {
            className += 'bg-red-100 dark:bg-red-900/40 border-red-400 text-red-800 dark:text-red-200 line-through';
          } else {
            className += 'bg-muted/50 border-transparent text-muted-foreground';
          }
        } else if (isSelected) {
          className += 'bg-primary/10 border-primary text-primary';
        } else {
          className += 'bg-muted/50 border-border hover:bg-muted hover:border-primary/50';
        }

        return (
          <span key={optIdx}>
            {optIdx > 0 && <span className="text-muted-foreground mx-0.5">|</span>}
            <button
              type="button"
              className={cn(className)}
              onClick={() => onSelect(optIdx)}
              disabled={submitted}
            >
              {opt}
            </button>
          </span>
        );
      })}
      <span className="text-muted-foreground">]</span>
    </span>
  );
}

function ResultDialog({
  result,
  wrongCount,
  onClose,
  onRetry,
  onRetryWrong,
}: {
  result: { score: number; correct: number; total: number };
  wrongCount: number;
  onClose: () => void;
  onRetry: () => void;
  onRetryWrong: () => void;
}) {
  const passed = result.score >= 80;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
            {passed ? (
              <>
                <Trophy className="h-5 w-5 text-yellow-500" />
                통과!
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                재도전
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-center">
            {passed ? '잘하셨습니다! 다음 단계로 넘어갈 수 있습니다.' : '80점 이상이면 통과입니다. 다시 도전해보세요!'}
          </DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-2 py-2">
          <div className={cn(
            'text-4xl font-bold',
            passed ? 'text-green-600' : 'text-orange-600'
          )}>
            {result.score}점
          </div>
          <p className="text-sm text-muted-foreground">
            {result.total}문제 중 {result.correct}문제 정답
          </p>
        </div>

        <div className="space-y-2">
          {wrongCount > 0 && (
            <Button className="w-full" onClick={() => { onClose(); onRetryWrong(); }}>
              <ListRestart className="h-4 w-4 mr-1" />
              오답만 다시 풀기
            </Button>
          )}
          {!passed && wrongCount === 0 && (
            <Button className="w-full" onClick={() => { onClose(); onRetry(); }}>
              <RotateCcw className="h-4 w-4 mr-1" />
              전체 다시 풀기
            </Button>
          )}
          <Button
            variant={passed && wrongCount === 0 ? 'default' : 'outline'}
            className="w-full"
            onClick={onClose}
          >
            {passed && wrongCount === 0 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                확인
              </>
            ) : (
              '닫기'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
