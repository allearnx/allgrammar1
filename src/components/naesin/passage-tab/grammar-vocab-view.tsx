'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, Trophy, RotateCcw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GrammarVocabItem, GrammarVocabChoicePoint } from '@/types/naesin';

interface GrammarVocabViewProps {
  items: GrammarVocabItem[];
  onScoreChange: (score: number) => void;
}

type SelectionMap = Record<string, number>; // key: `${itemIdx}-${cpIdx}`, value: selected option index

export function GrammarVocabView({ items, onScoreChange }: GrammarVocabViewProps) {
  const [selections, setSelections] = useState<SelectionMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultModal, setResultModal] = useState<{ score: number; correct: number; total: number } | null>(null);

  const totalChoicePoints = items.reduce((sum, item) => sum + item.choicePoints.length, 0);

  function selectOption(itemIdx: number, cpIdx: number, optionIdx: number) {
    if (submitted) return;
    setSelections((prev) => ({ ...prev, [`${itemIdx}-${cpIdx}`]: optionIdx }));
  }

  function handleSubmit() {
    let correct = 0;
    items.forEach((item, itemIdx) => {
      item.choicePoints.forEach((cp, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (selections[key] === cp.correctIndex) {
          correct++;
        }
      });
    });

    const score = totalChoicePoints > 0 ? Math.round((correct / totalChoicePoints) * 100) : 0;
    setSubmitted(true);
    setResultModal({ score, correct, total: totalChoicePoints });
    onScoreChange(score);
  }

  function handleRetry() {
    setSelections({});
    setSubmitted(false);
    setResultModal(null);
  }

  const allSelected = Object.keys(selections).length === totalChoicePoints;

  return (
    <div className="space-y-3">
      {/* Banner */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
        <Info className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          모든 시도가 기록됩니다. 문장을 읽고 올바른 표현을 선택하세요.
        </p>
      </div>

      {/* Sentence cards */}
      {items.map((item, itemIdx) => (
        <SentenceCard
          key={itemIdx}
          item={item}
          itemIdx={itemIdx}
          selections={selections}
          submitted={submitted}
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
          <Button className="w-full" variant="outline" onClick={handleRetry}>
            <RotateCcw className="h-4 w-4 mr-1" />
            다시 풀기
          </Button>
        )}
      </div>

      {/* Result Dialog */}
      {resultModal && (
        <ResultDialog
          result={resultModal}
          onClose={() => setResultModal(null)}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

function SentenceCard({
  item,
  itemIdx,
  selections,
  submitted,
  onSelect,
}: {
  item: GrammarVocabItem;
  itemIdx: number;
  selections: SelectionMap;
  submitted: boolean;
  onSelect: (itemIdx: number, cpIdx: number, optionIdx: number) => void;
}) {
  const words = item.original.split(/\s+/);

  // Build ranges covered by choice points
  const cpRanges = item.choicePoints.map((cp, cpIdx) => ({
    cpIdx,
    cp,
    startWord: cp.startWord,
    endWord: cp.endWord,
  }));

  // Render words with inline choice points
  const elements: React.ReactNode[] = [];
  let wordIdx = 0;

  while (wordIdx < words.length) {
    const range = cpRanges.find((r) => r.startWord === wordIdx);
    if (range) {
      const key = `${itemIdx}-${range.cpIdx}`;
      const selectedIdx = selections[key];
      elements.push(
        <ChoicePointInline
          key={`cp-${key}`}
          cp={range.cp}
          selectedIdx={selectedIdx}
          submitted={submitted}
          onSelect={(optIdx) => onSelect(itemIdx, range.cpIdx, optIdx)}
        />
      );
      wordIdx = range.endWord + 1;
    } else {
      elements.push(
        <span key={`w-${wordIdx}`} className="inline">
          {wordIdx > 0 && ' '}{words[wordIdx]}
        </span>
      );
      wordIdx++;
    }
  }

  return (
    <Card>
      <CardContent className="py-3 px-4 space-y-2">
        <p className="text-sm text-muted-foreground">{item.korean}</p>
        <div className="text-base leading-relaxed flex flex-wrap items-center gap-y-1">
          {elements}
        </div>
      </CardContent>
    </Card>
  );
}

function ChoicePointInline({
  cp,
  selectedIdx,
  submitted,
  onSelect,
}: {
  cp: GrammarVocabChoicePoint;
  selectedIdx: number | undefined;
  submitted: boolean;
  onSelect: (optIdx: number) => void;
}) {
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
  onClose,
  onRetry,
}: {
  result: { score: number; correct: number; total: number };
  onClose: () => void;
  onRetry: () => void;
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

        <div className="flex gap-2">
          {!passed && (
            <Button className="flex-1" onClick={() => { onClose(); onRetry(); }}>
              <RotateCcw className="h-4 w-4 mr-1" />
              다시 풀기
            </Button>
          )}
          <Button
            variant={passed ? 'default' : 'outline'}
            className="flex-1"
            onClick={onClose}
          >
            {passed ? (
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
