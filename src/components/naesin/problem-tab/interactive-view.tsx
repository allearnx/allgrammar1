'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MCQOptionList } from '@/components/shared/mcq-option-list';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/database';
import type { WrongItem } from '@/hooks/use-problem-draft';
import { useInteractiveProblem } from './use-interactive-problem';
import { ResultsScreen } from './results-screen';

export type { WrongItem };

function MinTimeBadge({ remaining }: { remaining: number }) {
  if (remaining <= 0) return null;
  return (
    <Badge variant="secondary" className="gap-1 tabular-nums">
      <Clock className="h-3 w-3" />
      {remaining}초 후 답변 가능
    </Badge>
  );
}

function SubjectiveInput({ onSubmit, disabled, isGrading }: { onSubmit: (answer: string) => void; disabled: boolean; isGrading: boolean }) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="max-w-lg mx-auto space-y-2">
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="답을 입력하세요"
        disabled={disabled}
        rows={3}
        className="resize-none"
      />
      <Button
        onClick={() => onSubmit(answer)}
        disabled={disabled || !answer.trim()}
        className="w-full"
      >
        {isGrading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            채점 중...
          </>
        ) : (
          '제출'
        )}
      </Button>
    </div>
  );
}

export function InteractiveProblemView({
  sheet,
  unitId,
  onComplete,
}: {
  sheet: NaesinProblemSheet;
  unitId: string;
  onComplete?: () => void;
}) {
  const questions = sheet.questions as NaesinProblemQuestion[];
  const {
    currentIndex, selectedAnswer, showResult, score, finished,
    wrongList, isGrading, isCurrentCorrect,
    question, isSubjective, isMultiSelect, multiSelectedValues, remaining, isReady,
    handleSelect, handleMultiToggle, handleMultiSubmit, handleNext, handleMidSave, isMidSaving, answersMap,
  } = useInteractiveProblem({ sheetId: sheet.id, questions, unitId, onComplete });

  if (questions.length === 0) {
    return <p className="text-center text-muted-foreground py-4">문제가 없습니다.</p>;
  }

  if (finished) {
    return <ResultsScreen score={score} totalQuestions={questions.length} wrongList={wrongList} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMidSave}
            disabled={isMidSaving || Object.keys(answersMap).length === 0}
          >
            {isMidSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="ml-1 hidden sm:inline">중간 저장</span>
          </Button>
          {!showResult && <MinTimeBadge remaining={remaining} />}
          <Badge variant="secondary" className="text-green-600">{score.correct} 정답</Badge>
          <Badge variant="secondary" className="text-red-600">{score.wrong} 오답</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground mb-2">문제 {question.number}</p>
          <p className="text-lg font-medium whitespace-pre-wrap">
            {(() => {
              const q = question.question.replace(/\\n/g, '\n');
              if (/^\[.+?\]/.test(q)) {
                return (
                  <>
                    <span className="font-bold">{q.match(/^\[.+?\]/)![0]}</span>
                    {q.replace(/^\[.+?\]/, '')}
                  </>
                );
              }
              return q;
            })()}
          </p>
        </CardContent>
      </Card>

      {question.options && question.options.length > 0 ? (
        <MCQOptionList
          options={question.options}
          selectedAnswer={selectedAnswer}
          correctAnswer={String(question.answer)}
          showResult={showResult}
          onSelect={(v) => handleSelect(v as string)}
          className="max-w-lg mx-auto"
          multiSelect={isMultiSelect}
          selectedValues={multiSelectedValues}
          onToggle={handleMultiToggle}
          onSubmit={handleMultiSubmit}
        />
      ) : (
        <SubjectiveInput
          onSubmit={(answer) => handleSelect(answer)}
          disabled={showResult}
          isGrading={isGrading}
        />
      )}

      {showResult && isSubjective && selectedAnswer !== null && (
        <div className="max-w-lg mx-auto space-y-2">
          <div className={cn(
            'text-center text-sm font-medium py-1.5 rounded-md',
            isCurrentCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {isCurrentCorrect ? '정답입니다!' : '오답입니다'}
          </div>
          {!isCurrentCorrect && (
            <div className="text-center text-sm text-green-700 bg-green-50 py-1.5 rounded-md">
              정답: {String(question.answer)}
            </div>
          )}
        </div>
      )}

      {showResult && !finished && currentIndex < questions.length - 1 && (
        <div className="text-center">
          <Button onClick={handleNext}>다음 문제</Button>
        </div>
      )}

      {showResult && question.explanation && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">해설:</span> {question.explanation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
