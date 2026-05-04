'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Printer, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormattedText } from '@/components/shared/formatted-text';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/database';
import { usePaperTest } from './use-paper-test';
import { ResultsScreen } from './results-screen';

const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤'];

function isMultiSelectQuestion(q: NaesinProblemQuestion): boolean {
  return (
    (q.options && q.options.length > 0 && String(q.answer).includes(',')) ||
    /모두\s*고르/.test(q.question)
  );
}

function PaperQuestion({
  question,
  index,
  answer,
  onAnswerChange,
}: {
  question: NaesinProblemQuestion;
  index: number;
  answer: string | number | undefined;
  onAnswerChange: (value: string | number) => void;
}) {
  const hasOptions = question.options && question.options.length > 0;
  const isSubjective = !hasOptions;
  const isMulti = hasOptions && isMultiSelectQuestion(question);

  // Parse multi-select answer from comma-separated string
  const selectedValues = isMulti ? String(answer ?? '').split(',').map((s) => s.trim()).filter(Boolean) : [];

  function handleMultiToggle(val: string) {
    const next = selectedValues.includes(val)
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val];
    onAnswerChange(next.sort((a, b) => Number(a) - Number(b)).join(', '));
  }

  const questionText = question.question.replace(/\\n/g, '\n');
  const tagMatch = questionText.match(/^\[.+?\]/);

  return (
    <div className="paper-test-question border-b border-border pb-4 mb-4 last:border-0">
      {/* Question header */}
      <div className="flex gap-2 mb-2">
        <span className="font-bold text-sm shrink-0 mt-0.5">{question.number}.</span>
        <div className="text-sm whitespace-pre-wrap">
          {tagMatch ? (
            <>
              <span className="font-bold">{tagMatch[0]}</span>
              <FormattedText text={questionText.replace(/^\[.+?\]/, '')} />
            </>
          ) : (
            <FormattedText text={questionText} />
          )}
        </div>
      </div>

      {/* Image */}
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt={`문제 ${question.number}`}
          className="max-w-full max-h-48 rounded border mb-2 ml-6"
        />
      )}

      {/* Answer input */}
      <div className="ml-6">
        {hasOptions && !isMulti ? (
          /* MCQ: radio buttons */
          <div className="space-y-1">
            {question.options!.map((opt, oi) => {
              const val = String(oi + 1);
              const isSelected = String(answer) === val;
              return (
                <label
                  key={oi}
                  className={cn(
                    'flex items-start gap-2 px-2 py-1 rounded cursor-pointer transition-colors text-sm',
                    isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
                  )}
                >
                  <input
                    type="radio"
                    name={`paper-q-${index}`}
                    value={val}
                    checked={isSelected}
                    onChange={() => onAnswerChange(val)}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className="font-medium mr-1">{CIRCLED_NUMBERS[oi] ?? `${oi + 1}`}</span>
                    <FormattedText text={opt} />
                  </span>
                </label>
              );
            })}
          </div>
        ) : hasOptions && isMulti ? (
          /* Multi-select: checkboxes */
          <div className="space-y-1">
            {question.options!.map((opt, oi) => {
              const val = String(oi + 1);
              const isChecked = selectedValues.includes(val);
              return (
                <label
                  key={oi}
                  className={cn(
                    'flex items-start gap-2 px-2 py-1 rounded cursor-pointer transition-colors text-sm',
                    isChecked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleMultiToggle(val)}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className="font-medium mr-1">{CIRCLED_NUMBERS[oi] ?? `${oi + 1}`}</span>
                    <FormattedText text={opt} />
                  </span>
                </label>
              );
            })}
          </div>
        ) : question.subParts ? (
          /* subParts: labeled inputs */
          <div className="space-y-2">
            {question.subParts.map((part, pi) => {
              const parts = String(answer ?? '').split(' / ');
              return (
                <div key={pi} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-8 shrink-0">{part.label}</span>
                  <Input
                    value={parts[pi] ?? ''}
                    onChange={(e) => {
                      const next = [...parts];
                      while (next.length <= pi) next.push('');
                      next[pi] = e.target.value;
                      onAnswerChange(next.join(' / '));
                    }}
                    placeholder={`${part.label} 답`}
                    className="h-8 text-sm"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Subjective: textarea */
          <Textarea
            value={String(answer ?? '')}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="답을 입력하세요"
            rows={2}
            className="resize-none text-sm"
          />
        )}
      </div>
    </div>
  );
}

export function PaperTestView({
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
    answersMap,
    setAnswer,
    answeredCount,
    isSubmitting,
    finished,
    results,
    wrongList,
    submitFailed,
    handleSubmit,
    retrySubmit,
    handleMidSave,
    isMidSaving,
  } = usePaperTest({ sheetId: sheet.id, questions, unitId, onComplete });
  const [isRetrying, setIsRetrying] = useState(false);

  if (questions.length === 0) {
    return <p className="text-center text-muted-foreground py-4">문제가 없습니다.</p>;
  }

  if (finished && results) {
    return <ResultsScreen score={results} totalQuestions={questions.length} wrongList={wrongList} />;
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
      </div>
    );
  }

  const unanswered = questions.length - answeredCount;

  return (
    <div className="paper-test-printable">
      {/* Print-only header */}
      <div className="paper-test-print-header hidden">
        <h1 className="text-lg font-bold">{sheet.title}</h1>
        <div className="flex gap-8 text-sm mt-1">
          <span>이름: __________________</span>
          <span>날짜: __________________</span>
        </div>
        <hr className="mt-2 mb-4 border-black" />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <span className="text-sm text-muted-foreground">
          {answeredCount} / {questions.length} 답변
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMidSave}
            disabled={isMidSaving || answeredCount === 0}
          >
            {isMidSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">중간 저장</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">인쇄</span>
          </Button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-0">
        {questions.map((q, i) => (
          <PaperQuestion
            key={i}
            question={q}
            index={i}
            answer={answersMap[i]}
            onAnswerChange={(val) => setAnswer(i, val)}
          />
        ))}
      </div>

      {/* Bottom sticky submit bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-3 mt-4 print:hidden">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-2">
          <span className="text-sm text-muted-foreground">
            {unanswered > 0 ? `${unanswered}문제 미답변` : '모두 답변 완료'}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount === 0}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                채점 중...
              </>
            ) : (
              '제출하기'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
