'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MCQOptionList } from '@/components/shared/mcq-option-list';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/database';
import type { AiFeedback, WrongItem } from '@/hooks/use-problem-draft';
import { useInteractiveProblem } from './use-interactive-problem';
import { ResultsScreen } from './results-screen';

export type { AiFeedback, WrongItem };

function TimerBadge({ remaining, isExpired }: { remaining: number; isExpired: boolean }) {
  if (isExpired) {
    return (
      <Badge variant="destructive" className="gap-1 animate-pulse">
        <Clock className="h-3 w-3" />
        시간 초과
      </Badge>
    );
  }
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}초`;
  const isWarning = remaining <= 10;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 tabular-nums',
        isWarning && 'bg-yellow-100 text-yellow-700 border-yellow-300 animate-pulse',
      )}
    >
      <Clock className="h-3 w-3" />
      {display}
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
            AI 채점 중...
          </>
        ) : (
          '제출'
        )}
      </Button>
    </div>
  );
}

function AiFeedbackCard({ feedback, isCorrect }: { feedback: AiFeedback; isCorrect: boolean }) {
  return (
    <Card className={cn(
      'border',
      isCorrect ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
    )}>
      <CardContent className="py-3 space-y-2">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">AI 채점</span>
          <Badge variant={isCorrect ? 'default' : 'secondary'} className={cn(
            'ml-auto',
            isCorrect ? 'bg-green-600' : 'bg-orange-500 text-white'
          )}>
            {feedback.score}점
          </Badge>
        </div>
        <p className="text-sm">{feedback.feedback}</p>
        <div className="text-sm">
          <span className="font-medium text-green-700">교정 답안: </span>
          <span className="text-green-800">{feedback.correctedAnswer}</span>
        </div>
      </CardContent>
    </Card>
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
    wrongList, isGrading, currentAiFeedback,
    question, isSubjective, remaining, isExpired,
    handleSelect, handleNext,
  } = useInteractiveProblem({ sheetId: sheet.id, questions, unitId, onComplete });

  if (questions.length === 0) {
    return <p className="text-center text-muted-foreground py-4">문제가 없습니다.</p>;
  }

  if (finished) {
    return <ResultsScreen score={score} totalQuestions={questions.length} wrongList={wrongList} />;
  }

  const isCurrentCorrect = showResult && (
    isSubjective
      ? (currentAiFeedback ? currentAiFeedback.score >= 80 : false)
      : String(selectedAnswer) === String(question.answer)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
        <div className="flex gap-2">
          {!showResult && <TimerBadge remaining={remaining} isExpired={isExpired} />}
          <Badge variant="secondary" className="text-green-600">{score.correct} 정답</Badge>
          <Badge variant="secondary" className="text-red-600">{score.wrong} 오답</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground mb-2">문제 {question.number}</p>
          <p className="text-lg font-medium whitespace-pre-wrap">{question.question}</p>
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
          {currentAiFeedback && (
            <AiFeedbackCard feedback={currentAiFeedback} isCorrect={isCurrentCorrect} />
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
