'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MCQOptionList } from '@/components/shared/mcq-option-list';
import { FormattedText } from '@/components/shared/formatted-text';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/database';
import type { SubPart } from '@/types/naesin';
import type { WrongItem } from '@/hooks/use-problem-draft';
import { useInteractiveProblem } from './use-interactive-problem';
import { ResultsScreen } from './results-screen';

export type { WrongItem };

function MinTimeBadge({ remaining }: { remaining: number }) {
  if (remaining <= 0) return null;
  return (
    <Badge variant="secondary" className="gap-1 tabular-nums">
      <Clock className="h-3 w-3" />
      문제를 꼼꼼하게 읽고 푸세요
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

function MultiPartInput({ subParts, onSubmit, disabled, isGrading }: {
  subParts: SubPart[];
  onSubmit: (answer: string) => void;
  disabled: boolean;
  isGrading: boolean;
}) {
  const [answers, setAnswers] = useState<string[]>(subParts.map(() => ''));
  const allFilled = answers.every(a => a.trim());

  return (
    <div className="max-w-lg mx-auto space-y-3">
      {subParts.map((part, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-8 shrink-0">{part.label}</span>
          <Input
            value={answers[i]}
            onChange={(e) => { const next = [...answers]; next[i] = e.target.value; setAnswers(next); }}
            placeholder={`${part.label} 답을 입력하세요`}
            disabled={disabled}
          />
        </div>
      ))}
      <Button onClick={() => onSubmit(answers.join(' / '))} disabled={disabled || !allFilled} className="w-full">
        {isGrading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />채점 중...</>) : ('제출')}
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
  unitId?: string | null;
  onComplete?: () => void;
}) {
  const questions = sheet.questions as NaesinProblemQuestion[];
  const {
    currentIndex, selectedAnswer, showResult, score, finished,
    wrongList, isGrading, isCurrentCorrect,
    question, isSubjective, isMultiSelect, multiSelectedValues, remaining, isReady,
    handleSelect, handleMultiToggle, handleMultiSubmit, handleNext, handleMidSave, isMidSaving, answersMap,
    submitFailed, retrySubmit, multiExpectedCount,
  } = useInteractiveProblem({ sheetId: sheet.id, questions, unitId, onComplete });
  const [isRetrying, setIsRetrying] = useState(false);

  if (questions.length === 0) {
    return <p className="text-center text-muted-foreground py-4">문제가 없습니다.</p>;
  }

  if (finished) {
    return <ResultsScreen score={score} totalQuestions={questions.length} wrongList={wrongList} />;
  }

  if (submitFailed) {
    return (
      <div className="space-y-4 max-w-md mx-auto py-8 text-center">
        <div className="text-red-600 text-lg font-semibold">결과 저장에 실패했습니다</div>
        <p className="text-sm text-muted-foreground">
          네트워크 오류로 결과가 저장되지 않았습니다.<br />
          답안은 안전하게 보관되어 있으니 아래 버튼을 눌러 다시 저장해 주세요.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button
            onClick={async () => { setIsRetrying(true); await retrySubmit(); setIsRetrying(false); }}
            disabled={isRetrying}
          >
            {isRetrying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            다시 저장하기
          </Button>
        </div>
        <div className="text-xs text-muted-foreground pt-4">
          점수: {score.correct}개 정답 / {questions.length}문제 ({Math.round((score.correct / questions.length) * 100)}점)
        </div>
      </div>
    );
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
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt={`문제 ${question.number}`}
              className="max-w-full rounded-lg border mb-3"
            />
          )}
          <p className="text-lg font-medium whitespace-pre-wrap">
            {(() => {
              const q = question.question.replace(/\\n/g, '\n');
              if (/^\[.+?\]/.test(q)) {
                return (
                  <>
                    <span className="font-bold">{q.match(/^\[.+?\]/)![0]}</span>
                    <FormattedText text={q.replace(/^\[.+?\]/, '')} />
                  </>
                );
              }
              return <FormattedText text={q} />;
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
          expectedCount={multiExpectedCount}
        />
      ) : question.subParts ? (
        <MultiPartInput
          key={currentIndex}
          subParts={question.subParts}
          onSubmit={(answer) => handleSelect(answer)}
          disabled={showResult}
          isGrading={isGrading}
        />
      ) : (
        <SubjectiveInput
          key={currentIndex}
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
          {!isCurrentCorrect && question.subParts ? (
            <div className="space-y-1 text-sm rounded-md bg-gray-50 p-3">
              {(() => {
                const parts = String(selectedAnswer).split(' / ');
                return question.subParts.map((sp, i) => {
                  const studentAns = parts[i]?.trim() ?? '';
                  const candidates = [sp.answer, ...(sp.acceptedAnswers ?? [])];
                  const norm = (s: string) => s.trim().toLowerCase().replace(/[.\s]+$/g, '');
                  const partCorrect = candidates.some(c => norm(c) === norm(studentAns));
                  return (
                    <div key={i} className="flex gap-2">
                      <span className="font-medium w-8 shrink-0">{sp.label}</span>
                      <span className={partCorrect ? 'text-green-600' : 'text-red-500'}>{studentAns || '(미입력)'}</span>
                      {!partCorrect && <span className="text-green-600">→ {sp.answer}</span>}
                    </div>
                  );
                });
              })()}
            </div>
          ) : !isCurrentCorrect ? (
            <div className="text-center text-sm text-green-700 bg-green-50 py-1.5 rounded-md">
              정답: {String(question.answer)}
            </div>
          ) : null}
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
