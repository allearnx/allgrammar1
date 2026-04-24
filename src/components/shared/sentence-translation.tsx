'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle, ChevronRight, Loader2, ListRestart } from 'lucide-react';
import { QuizCompletionActions } from '@/components/shared/quiz-completion-actions';
import type { TranslationExerciseProps, SentenceData } from './translation-exercise';
import { useSentenceTranslationState } from '@/hooks/use-sentence-translation-state';

export function SentenceBysentenceTranslation({ passage, onComplete, onPageWrongs, showWrongAlert, sentencesPerPage = 10 }: TranslationExerciseProps) {
  const sentences = passage.sentences! as SentenceData[];

  const {
    currentPage,
    answers,
    grading,
    gradingError,
    allCorrectCount,
    completed,
    retryMode,
    retryWrongIndices,
    totalPages,
    effectiveSentences,
    currentResults,
    filledCount,
    allFilled,
    isPageGraded,
    isLastPage,
    wrongCount,
    updateAnswer,
    handleSubmitPage,
    handleNextPage,
    handleRetryWrong,
    handleReset,
  } = useSentenceTranslationState({ sentences, sentencesPerPage, onComplete, onPageWrongs });

  return (
    <div className="space-y-3">
      {/* 안내 배너 */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
        <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          한국어 해석을 보고 영어 원문을 그대로 작성하세요. AI가 채점합니다.
        </p>
      </div>

      {retryMode && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          <ListRestart className="h-3.5 w-3.5 shrink-0" />
          틀린 {retryWrongIndices.length}문장만 다시 풀어보세요
        </div>
      )}

      {/* 진행률 */}
      {!retryMode && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>페이지 {currentPage + 1}/{totalPages} (문장 {currentPage * sentencesPerPage + 1}~{Math.min((currentPage + 1) * sentencesPerPage, sentences.length)})</span>
          {completed && (
            <Badge variant="secondary">
              {allCorrectCount}/{sentences.length} 정답
            </Badge>
          )}
        </div>
      )}

      {effectiveSentences.map(({ sentence: s, globalIdx }) => {
        const result = currentResults?.[globalIdx];
        return (
          <Card key={globalIdx} className={result ? (result.score === 100 ? 'border-green-500' : 'border-red-500') : ''}>
            <CardContent className="py-3 px-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="text-xs font-medium mr-1">{globalIdx + 1}.</span>
                {s.korean}
              </p>
              {!isPageGraded ? (
                <Textarea
                  className="text-sm min-h-[2.5rem] resize-none"
                  rows={1}
                  value={answers[globalIdx] || ''}
                  onChange={(e) => updateAnswer(globalIdx, e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  placeholder="영어로 작성..."
                  disabled={grading}
                  autoComplete="off"
                />
              ) : result ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{answers[globalIdx]}</p>
                    <Badge
                      variant={result.score === 100 ? 'default' : 'secondary'}
                      className={result.score === 100 ? 'bg-green-500 shrink-0' : 'shrink-0'}
                    >
                      {result.score === 100 ? '정답' : '오답'}
                    </Badge>
                  </div>
                  {result.score < 100 && (
                    <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
                      {result.feedback && <p className="text-muted-foreground">{result.feedback}</p>}
                      <p className="font-medium">정답: {result.correctedSentence}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {!isPageGraded && !allFilled && filledCount > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {filledCount}/{effectiveSentences.length} 문장 작성 완료
        </p>
      )}

      {gradingError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {gradingError}
        </div>
      )}

      <div className="flex gap-2">
        {!isPageGraded ? (
          <Button onClick={handleSubmitPage} className="w-full" disabled={!allFilled || grading}>
            {grading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" />채점 중...</>
            ) : (
              <><Send className="h-4 w-4 mr-1" />제출하기 ({filledCount}/{effectiveSentences.length})</>
            )}
          </Button>
        ) : !isLastPage && !completed ? (
          <Button onClick={handleNextPage} className="w-full">
            다음 페이지
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <QuizCompletionActions
            wrongCount={wrongCount}
            onRetryWrong={handleRetryWrong}
            onReset={handleReset}
          />
        )}
      </div>

      {completed && showWrongAlert && wrongCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          오답이 기록되었습니다. 오답을 써서 선생님에게 제출하세요.
        </div>
      )}
    </div>
  );
}
