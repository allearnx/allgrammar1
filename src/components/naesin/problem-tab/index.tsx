'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getEncouragement } from '@/lib/naesin/encouragement';
import { extractAnswer } from '@/lib/naesin/normalize-answer';
import { InteractiveProblemView } from './interactive-view';
import { ImageAnswerView } from './image-answer-view';
import { ExternalPassageView } from './external-passage-view';
import type { NaesinProblemSheet } from '@/types/database';

interface LastAttempt {
  score: number;
  total_questions: number;
  wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
  created_at: string;
}

interface ProblemTabProps {
  sheets: NaesinProblemSheet[];
  unitId: string;
  onStageComplete?: () => void;
  bestScoreBySheet?: Record<string, number>;
  lastAttemptBySheet?: Record<string, LastAttempt>;
  onActiveSheetChange?: (category: string) => void;
}

export function ProblemTab({ sheets, unitId, onStageComplete, bestScoreBySheet, lastAttemptBySheet, onActiveSheetChange }: ProblemTabProps) {
  const [activeSheetId, setActiveSheetId] = useState<string | null>(sheets[0]?.id || null);
  const [retrySheetIds, setRetrySheetIds] = useState<Set<string>>(new Set());

  const activeSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  useEffect(() => {
    if (activeSheet && onActiveSheetChange) {
      onActiveSheetChange(activeSheet.category);
    }
  }, [activeSheet?.category, onActiveSheetChange]);

  if (sheets.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          등록된 문제지가 없습니다.
        </p>
      </div>
    );
  }

  const lastAttempt = lastAttemptBySheet?.[activeSheet.id];
  const hasCompleted = bestScoreBySheet?.[activeSheet.id] != null;
  const showSummary = hasCompleted && lastAttempt && !retrySheetIds.has(activeSheet.id);

  function handleRetry() {
    setRetrySheetIds((prev) => new Set(prev).add(activeSheet.id));
  }

  function handleSelectSheet(sheetId: string) {
    setActiveSheetId(sheetId);
  }

  return (
    <div className="space-y-4">
      {sheets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sheets.map((sheet) => {
            const bestScore = bestScoreBySheet?.[sheet.id];
            const hasScore = bestScore != null;
            const isActive = activeSheetId === sheet.id;
            return (
              <button
                type="button"
                key={sheet.id}
                onClick={() => handleSelectSheet(sheet.id)}
                className={cn(
                  'shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : hasScore
                      ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                      : 'bg-card hover:bg-muted border-border'
                )}
              >
                {hasScore && <span className="mr-1">&#10003;</span>}
                {sheet.title}
                {hasScore && <span className="ml-1">{bestScore}점</span>}
              </button>
            );
          })}
        </div>
      )}

      {showSummary ? (
        <AttemptSummary attempt={lastAttempt} onRetry={handleRetry} />
      ) : activeSheet.category === 'external_passage' ? (
        <ExternalPassageView
          key={activeSheet.id}
          sheet={activeSheet}
          unitId={unitId}
          onComplete={onStageComplete}
        />
      ) : activeSheet.mode === 'interactive' ? (
        <InteractiveProblemView
          key={activeSheet.id}
          sheet={activeSheet}
          unitId={unitId}
          onComplete={onStageComplete}
        />
      ) : (
        <ImageAnswerView
          key={activeSheet.id}
          sheet={activeSheet}
          unitId={unitId}
          onComplete={onStageComplete}
        />
      )}
    </div>
  );
}

function AttemptSummary({ attempt, onRetry }: { attempt: LastAttempt; onRetry: () => void }) {
  const pct = attempt.score;
  const correct = Math.round((pct / 100) * attempt.total_questions);
  const wrongList = attempt.wrong_answers || [];
  const date = new Date(attempt.created_at);
  const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">{dateStr} 풀이 결과</p>
        <p className={cn(
          'text-5xl font-bold',
          pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
        )}>
          {pct}점
        </p>
        <p className="text-muted-foreground">
          {attempt.total_questions}문제 중 {correct}개 정답
        </p>
        <p className={cn(
          'text-sm font-medium',
          pct >= 80 ? 'text-green-600' : 'text-orange-600'
        )}>
          {getEncouragement(pct)}
        </p>
      </div>

      {wrongList.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="font-medium text-red-600 mb-3">틀린 문제 ({wrongList.length}개)</p>
            <div className="space-y-3">
              {wrongList.map((w, i) => (
                <div key={i} className="text-sm border-b last:border-0 pb-2 space-y-1">
                  <p className="font-medium">#{w.number}. {w.question || ''}</p>
                  <p className="text-red-500">내 답: {String(w.userAnswer || '-')}</p>
                  <p className="text-green-600">정답: {extractAnswer(w.correctAnswer)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          다시 풀기
        </Button>
      </div>
    </div>
  );
}
