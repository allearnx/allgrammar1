'use client';

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
import { useGrammarVocabQuiz } from '@/hooks/use-grammar-vocab-quiz';
import type { WrongChoicePoint, SelectionMap } from '@/hooks/use-grammar-vocab-quiz';
import type { GrammarVocabItem, GrammarVocabChoicePoint } from '@/types/naesin';

export type { WrongChoicePoint };

interface GrammarVocabViewProps {
  items: GrammarVocabItem[];
  onScoreChange: (score: number, wrongs?: WrongChoicePoint[]) => void;
}

export function GrammarVocabView({ items, onScoreChange }: GrammarVocabViewProps) {
  const q = useGrammarVocabQuiz({ items, onScoreChange });

  return (
    <div className="space-y-3">
      {/* Banner */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
        <Info className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          모든 시도가 기록됩니다. 문장을 읽고 올바른 표현을 선택하세요.
        </p>
      </div>

      {q.retryMode && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          <ListRestart className="h-3.5 w-3.5 shrink-0" />
          틀린 문제만 다시 풀어보세요 (맞은 선택지는 잠금 처리됨)
        </div>
      )}

      {/* Sentence cards */}
      {q.visibleItems.map(({ item, idx: itemIdx }) => (
        <SentenceCard
          key={itemIdx}
          item={item}
          itemIdx={itemIdx}
          validChoicePoints={q.validCPMap[itemIdx]}
          selections={q.selections}
          submitted={q.submitted}
          lockedKeys={q.lockedCorrectKeys}
          onSelect={q.selectOption}
        />
      ))}

      {/* Submit / Retry */}
      <div className="flex gap-2">
        {!q.submitted ? (
          <Button
            className="w-full"
            onClick={q.handleSubmit}
            disabled={!q.allSelected}
          >
            제출하기
          </Button>
        ) : (
          <>
            {q.wrongCount > 0 && (
              <Button className="flex-1" onClick={q.handleRetryWrong}>
                <ListRestart className="h-4 w-4 mr-1" />
                오답만 다시 풀기
              </Button>
            )}
            <Button className="flex-1" variant="outline" onClick={q.handleRetry}>
              <RotateCcw className="h-4 w-4 mr-1" />
              전체 다시 풀기
            </Button>
          </>
        )}
      </div>

      {/* Result Dialog */}
      {q.resultModal && (
        <ResultDialog
          result={q.resultModal}
          wrongCount={q.wrongCount}
          onClose={() => q.setResultModal(null)}
          onRetry={q.handleRetry}
          onRetryWrong={q.handleRetryWrong}
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
