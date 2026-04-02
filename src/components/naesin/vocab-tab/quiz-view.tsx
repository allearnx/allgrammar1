'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Target, ListRestart } from 'lucide-react';
import { MCQOptionList } from '@/components/shared/mcq-option-list';
import { ScoreBadges, NextButton } from '@/components/memory/shared';
import { useQuizState } from '@/hooks/use-quiz-state';
import type { WrongWord } from '@/hooks/use-quiz-state';
import type { NaesinVocabulary } from '@/types/database';
import { QuizCompletionView } from './quiz-completion-view';

export function NaesinQuizView({
  vocabulary,
  allVocabulary,
  unitId,
  onComplete,
  onQuizSetResult,
  onGoToSpelling,
  quizResultEndpoint = '/api/naesin/vocab/quiz-result',
}: {
  vocabulary: NaesinVocabulary[];
  allVocabulary?: NaesinVocabulary[];
  unitId: string;
  onComplete: (score: number) => void;
  onQuizSetResult?: (score: number, wrongWords: WrongWord[]) => void;
  onGoToSpelling?: () => void;
  quizResultEndpoint?: string;
}) {
  const { containerRef, resultRef, ...q } = useQuizState({
    vocabulary,
    allVocabulary,
    unitId,
    onComplete,
    onQuizSetResult,
    quizResultEndpoint,
  });

  if (!q.question && !q.quizFinished) return null;

  if (q.quizFinished) {
    const combinedCorrect = q.retryPreviousCorrectCount + q.score.correct;
    const pct = q.getCombinedScore(q.score.correct, q.totalOriginalCount);

    return (
      <QuizCompletionView
        pct={pct}
        combinedCorrect={combinedCorrect}
        totalOriginalCount={q.totalOriginalCount}
        attemptNumber={q.attemptNumber}
        wrongWords={q.wrongWords}
        savedResult={q.savedResult}
        onRetryWrong={q.handleRetryWrong}
        onRetryAll={q.handleRetryAll}
        onCopyLink={q.handleCopyLink}
        onGoToSpelling={onGoToSpelling}
      />
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 scroll-mt-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{q.currentIndex + 1} / {q.questions.length}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
            <Target className="h-3 w-3" />
            목표 80점
          </span>
          <ScoreBadges correct={q.retryPreviousCorrectCount + q.score.correct} wrong={q.score.wrong} />
        </div>
      </div>

      {q.isRetrying && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          <ListRestart className="h-3.5 w-3.5 shrink-0" />
          틀린 {q.questions.length}개 단어만 다시 풀어보세요
        </div>
      )}

      <Card className="max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-2xl font-medium">{q.question!.front_text}</p>
        </CardContent>
      </Card>

      <MCQOptionList
        options={q.question!.options}
        selectedAnswer={q.selectedAnswer}
        correctAnswer={q.question!.correctIndex}
        showResult={q.showResult}
        onSelect={(v) => q.handleSelect(v as number)}
        labelStyle="alpha"
        className="max-w-md mx-auto"
      />

      {q.showResult && !q.quizFinished && (
        <div ref={resultRef} className="text-center">
          {q.currentIndex < q.questions.length - 1 ? (
            <NextButton onClick={q.handleNext} />
          ) : (
            q.saving ? <p className="text-sm text-muted-foreground">결과 저장 중...</p> : null
          )}
        </div>
      )}
    </div>
  );
}
