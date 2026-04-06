'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Undo2, Shuffle } from 'lucide-react';
import { cn, shuffle } from '@/lib/utils';
import { toast } from 'sonner';

interface DialogueLine {
  original: string;
  korean: string;
  speaker?: string;
  originalIndex: number;
}

export interface WrongOrdering {
  type: 'ordering';
  correctOrder: string;
  userOrder: string;
}

interface DialogueLineOrderingProps {
  sentences: { original: string; korean: string; speaker?: string }[];
  onComplete: (score: number, wrongAnswers: WrongOrdering[]) => void;
}

export function DialogueLineOrdering({ sentences, onComplete }: DialogueLineOrderingProps) {
  const lines: DialogueLine[] = sentences.map((s, i) => ({
    ...s,
    originalIndex: i,
  }));

  const [bank, setBank] = useState<DialogueLine[]>(() => shuffle([...lines]));
  const [selected, setSelected] = useState<DialogueLine[]>([]);
  const [showResult, setShowResult] = useState(false);

  const selectLine = useCallback((item: DialogueLine) => {
    if (showResult) return;
    setBank((prev) => prev.filter((l) => l !== item));
    setSelected((prev) => [...prev, item]);
  }, [showResult]);

  const deselectLine = useCallback((item: DialogueLine) => {
    if (showResult) return;
    setSelected((prev) => prev.filter((l) => l !== item));
    setBank((prev) => [...prev, item]);
  }, [showResult]);

  function handleUndo() {
    if (selected.length === 0 || showResult) return;
    const last = selected[selected.length - 1];
    setSelected((prev) => prev.slice(0, -1));
    setBank((prev) => [...prev, last]);
  }

  function handleShuffle() {
    if (showResult) return;
    setBank(shuffle([...lines]));
    setSelected([]);
  }

  function handleCheck() {
    if (selected.length !== lines.length) return;
    setShowResult(true);
  }

  const correctCount = selected.filter((item, i) => item.originalIndex === i).length;
  const score = Math.round((correctCount / lines.length) * 100);
  const allCorrect = correctCount === lines.length;

  function handleComplete() {
    const wrongs: WrongOrdering[] = [];
    if (!allCorrect) {
      wrongs.push({
        type: 'ordering',
        correctOrder: lines.map((l) => l.original).join(' → '),
        userOrder: selected.map((l) => l.original).join(' → '),
      });
    }
    onComplete(score, wrongs);
    toast.success(`순서 배열 완료! ${correctCount}/${lines.length} 정답`);
  }

  if (sentences.length === 0) {
    return <p className="text-center text-muted-foreground py-4">대화문이 없습니다.</p>;
  }

  const allPlaced = selected.length === lines.length;

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Card>
        <CardContent className="py-3 text-center">
          <p className="text-sm text-muted-foreground">
            대화 줄을 올바른 순서대로 탭하여 배열하세요
          </p>
        </CardContent>
      </Card>

      {/* Answer area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">내 배열:</p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleUndo}
              disabled={selected.length === 0 || showResult}
            >
              <Undo2 className="h-3 w-3 mr-1" />되돌리기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleShuffle}
              disabled={showResult}
            >
              <Shuffle className="h-3 w-3 mr-1" />초기화
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'min-h-[4rem] rounded-lg border-2 border-dashed p-2 space-y-1.5 transition-colors',
            selected.length === 0
              ? 'border-muted-foreground/20 bg-muted/30'
              : showResult && allCorrect
                ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                : showResult && !allCorrect
                  ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
                  : 'border-primary/30 bg-primary/5'
          )}
        >
          {selected.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              아래 대화를 탭하여 순서대로 배열하세요
            </p>
          )}
          {selected.map((item, idx) => {
            const isCorrectPosition = item.originalIndex === idx;
            return (
              <button
                key={`s-${item.originalIndex}`}
                type="button"
                onClick={() => deselectLine(item)}
                disabled={showResult}
                className={cn(
                  'w-full text-left rounded-md px-3 py-2 text-sm transition-all',
                  showResult
                    ? isCorrectPosition
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                    : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 active:scale-[0.99] cursor-pointer'
                )}
              >
                <span className="font-medium">{idx + 1}.</span>{' '}
                {item.speaker && (
                  <Badge variant="outline" className="mr-1.5 text-[10px] px-1 py-0">
                    {item.speaker}
                  </Badge>
                )}
                {item.original}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bank */}
      {bank.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">대화 선택:</p>
          <div className="space-y-1.5">
            {bank.map((item) => (
              <button
                key={`b-${item.originalIndex}`}
                type="button"
                onClick={() => selectLine(item)}
                disabled={showResult}
                className="w-full text-left rounded-md border px-3 py-2 text-sm bg-card hover:bg-muted active:scale-[0.99] cursor-pointer border-border shadow-sm transition-all"
              >
                {item.speaker && (
                  <Badge variant="outline" className="mr-1.5 text-[10px] px-1 py-0">
                    {item.speaker}
                  </Badge>
                )}
                {item.original}
                <span className="block text-xs text-muted-foreground mt-0.5">{item.korean}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className="space-y-2">
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2.5',
            allCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
          )}>
            {allCorrect ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  완벽해요! 모든 순서가 맞았습니다
                </span>
              </>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {correctCount}/{lines.length} 정답 (점수: {score}점)
                  </span>
                </div>
                <div className="pl-6 space-y-0.5">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">올바른 순서:</p>
                  {lines.map((line, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">
                      {i + 1}. {line.speaker ? `[${line.speaker}] ` : ''}{line.original}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Badge variant="secondary" className="w-full justify-center py-1">
            점수: {score}점
          </Badge>
        </div>
      )}

      {/* Action button */}
      {!showResult ? (
        <Button onClick={handleCheck} className="w-full" disabled={!allPlaced}>
          확인 ({selected.length}/{lines.length})
        </Button>
      ) : (
        <Button onClick={handleComplete} className="w-full">
          완료
        </Button>
      )}
    </div>
  );
}
