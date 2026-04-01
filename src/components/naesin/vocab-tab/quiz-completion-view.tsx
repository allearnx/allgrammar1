'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RotateCcw, Target, ArrowRight, CheckCircle, ListRestart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEncouragement } from '@/lib/naesin/encouragement';
import type { WrongWord } from '@/hooks/use-quiz-state';
import type { NaesinVocabQuizResult } from '@/types/database';

interface QuizCompletionViewProps {
  pct: number;
  combinedCorrect: number;
  totalOriginalCount: number;
  attemptNumber: number;
  wrongWords: WrongWord[];
  savedResult: NaesinVocabQuizResult | null;
  onRetryWrong: () => void;
  onRetryAll: () => void;
  onCopyLink: () => void;
  onGoToSpelling?: () => void;
}

export function QuizCompletionView({
  pct,
  combinedCorrect,
  totalOriginalCount,
  attemptNumber,
  wrongWords,
  savedResult,
  onRetryWrong,
  onRetryAll,
  onCopyLink,
  onGoToSpelling,
}: QuizCompletionViewProps) {
  const passed = pct >= 80;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Result CTA Banner */}
      <Card className={cn(
        'border',
        passed
          ? 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
          : 'border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800'
      )}>
        <CardContent className="py-4 text-center space-y-2">
          {passed ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
              <p className="font-medium text-green-800 dark:text-green-200">
                {getEncouragement(pct)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {onGoToSpelling ? '이제 스펠링으로 넘어가자!' : '잘했어요!'}
              </p>
              {onGoToSpelling && (
                <Button onClick={onGoToSpelling} className="mt-2">
                  스펠링 시작하기
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </>
          ) : (
            <>
              <Target className="h-8 w-8 text-orange-600 mx-auto" />
              <p className="font-medium text-orange-800 dark:text-orange-200">
                {getEncouragement(pct)}
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                다시 도전해봐!
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">{attemptNumber}회차 결과</p>
        <p className={cn(
          'text-6xl font-bold',
          pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
        )}>
          {pct}점
        </p>
        <p className="text-muted-foreground">
          {totalOriginalCount}문제 중 {combinedCorrect}개 정답
        </p>
      </div>

      {wrongWords.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="font-medium text-red-600 mb-3">틀린 단어 ({wrongWords.length}개)</p>
            <div className="space-y-2">
              {wrongWords.map((w, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                  <span className="font-medium">{w.front_text}</span>
                  <span className="text-muted-foreground">{w.back_text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {wrongWords.length > 0 && (
          <Button onClick={onRetryWrong} className={cn('w-full', !passed && 'ring-2 ring-orange-400')}>
            <ListRestart className="h-4 w-4 mr-2" />
            오답만 다시 풀기
          </Button>
        )}
        <Button variant="outline" onClick={onRetryAll} className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          전체 다시 풀기
        </Button>
        {savedResult && (
          <Button variant="ghost" size="sm" onClick={onCopyLink} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            결과 링크 복사
          </Button>
        )}
      </div>
    </div>
  );
}
