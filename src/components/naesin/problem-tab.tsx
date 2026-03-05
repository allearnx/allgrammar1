'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/database';

interface ProblemTabProps {
  sheets: NaesinProblemSheet[];
  unitId: string;
  onStageComplete?: () => void;
}

export function ProblemTab({ sheets, unitId, onStageComplete }: ProblemTabProps) {
  const [activeSheetId, setActiveSheetId] = useState<string | null>(sheets[0]?.id || null);

  if (sheets.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 문제지가 없습니다.
      </p>
    );
  }

  const activeSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  return (
    <div className="space-y-4">
      {sheets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sheets.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheetId(sheet.id)}
              className={cn(
                'shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors',
                activeSheetId === sheet.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border'
              )}
            >
              {sheet.title}
            </button>
          ))}
        </div>
      )}

      {activeSheet.mode === 'interactive' ? (
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

// ============================================
// Mode A: Interactive (parsed questions)
// ============================================

function InteractiveProblemView({
  sheet,
  unitId,
  onComplete,
}: {
  sheet: NaesinProblemSheet;
  unitId: string;
  onComplete?: () => void;
}) {
  const questions = sheet.questions as NaesinProblemQuestion[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);
  const [wrongList, setWrongList] = useState<{ number: number; userAnswer: string | number; correctAnswer: string | number; question: string }[]>([]);

  const question = questions[currentIndex];

  function handleSelect(answer: string | number) {
    if (showResult) return;
    setSelectedAnswer(answer);
    const correct = String(answer) === String(question.answer);
    setShowResult(true);
    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
      setWrongList((prev) => [...prev, {
        number: question.number,
        userAnswer: answer,
        correctAnswer: question.answer,
        question: question.question,
      }]);
    }

    if (currentIndex === questions.length - 1) {
      const finalCorrect = correct ? score.correct + 1 : score.correct;
      submitResults(
        questions.map((_, i) => i === currentIndex ? answer : ''),
        questions.length
      );
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setSelectedAnswer(null);
    }
  }

  async function submitResults(answers: (string | number)[], total: number) {
    try {
      const res = await fetch('/api/naesin/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: sheet.id,
          unitId,
          answers,
          totalQuestions: total,
        }),
      });
      const data = await res.json();
      setFinished(true);
      if (data.score >= 80) {
        toast.success('문제풀이를 완료했습니다!');
        onComplete?.();
      }
    } catch {
      setFinished(true);
    }
  }

  if (questions.length === 0) {
    return <p className="text-center text-muted-foreground py-4">문제가 없습니다.</p>;
  }

  if (finished) {
    const pct = Math.round((score.correct / questions.length) * 100);
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <p className={cn(
            'text-6xl font-bold',
            pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {pct}점
          </p>
          <p className="text-muted-foreground">
            {questions.length}문제 중 {score.correct}개 정답
          </p>
        </div>

        {wrongList.length > 0 && (
          <>
            <Card>
              <CardContent className="py-4">
                <p className="font-medium text-red-600 mb-3">틀린 문제 ({wrongList.length}개)</p>
                <div className="space-y-3">
                  {wrongList.map((w, i) => (
                    <div key={i} className="text-sm border-b last:border-0 pb-2">
                      <p className="font-medium">#{w.number}. {w.question}</p>
                      <p className="text-red-500">내 답: {w.userAnswer}</p>
                      <p className="text-green-600">정답: {w.correctAnswer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              오답이 기록되었습니다.
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
        <div className="flex gap-2">
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
        <div className="grid gap-3 max-w-lg mx-auto">
          {question.options.map((option, idx) => {
            const optionValue = String(idx + 1);
            const isSelected = String(selectedAnswer) === optionValue;
            const isCorrect = optionValue === String(question.answer);
            return (
              <Button
                key={idx}
                variant="outline"
                className={cn(
                  'h-auto py-3 px-4 text-left justify-start whitespace-normal',
                  showResult && isCorrect && 'border-green-500 bg-green-50 text-green-700',
                  showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50 text-red-700'
                )}
                onClick={() => handleSelect(optionValue)}
                disabled={showResult}
              >
                <span className="mr-3 shrink-0 font-medium">{idx + 1}.</span>
                {option}
                {showResult && isCorrect && <CheckCircle className="h-4 w-4 ml-auto shrink-0 text-green-500" />}
                {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 ml-auto shrink-0 text-red-500" />}
              </Button>
            );
          })}
        </div>
      ) : (
        <SubjectiveInput onSubmit={(answer) => handleSelect(answer)} disabled={showResult} />
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

function SubjectiveInput({ onSubmit, disabled }: { onSubmit: (answer: string) => void; disabled: boolean }) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="flex gap-2 max-w-lg mx-auto">
      <Input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="답을 입력하세요"
        disabled={disabled}
        className="flex-1"
      />
      <Button onClick={() => onSubmit(answer)} disabled={disabled || !answer.trim()}>
        제출
      </Button>
    </div>
  );
}

// ============================================
// Mode B: Image + Answer Key
// ============================================

function ImageAnswerView({
  sheet,
  unitId,
  onComplete,
}: {
  sheet: NaesinProblemSheet;
  unitId: string;
  onComplete?: () => void;
}) {
  const totalQuestions = sheet.answer_key.length;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<{ score: number; wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number }[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const answerArray = Array.from({ length: totalQuestions }, (_, i) => answers[i] || '');

    try {
      const res = await fetch('/api/naesin/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: sheet.id,
          unitId,
          answers: answerArray,
          totalQuestions,
        }),
      });
      const data = await res.json();
      setResults({ score: data.score, wrongAnswers: data.wrongAnswers });
      if (data.score >= 80) {
        toast.success('문제풀이를 완료했습니다!');
        onComplete?.();
      }
    } catch {
      toast.error('제출 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {sheet.pdf_url && (
        <div className="border rounded-lg overflow-hidden">
          <iframe
            src={sheet.pdf_url}
            className="w-full h-[500px]"
            title={sheet.title}
          />
        </div>
      )}

      {!results ? (
        <>
          <div className="space-y-3">
            <p className="text-sm font-medium">답 입력 ({totalQuestions}문항)</p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalQuestions }, (_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <Input
                    className="h-8 text-sm text-center"
                    value={answers[i] || ''}
                    onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
            {submitting ? '채점 중...' : '제출하기'}
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className={cn(
              'text-5xl font-bold',
              results.score >= 80 ? 'text-green-600' : results.score >= 50 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {results.score}점
            </p>
          </div>

          {results.wrongAnswers.length > 0 && (
            <>
              <Card>
                <CardContent className="py-4">
                  <p className="font-medium text-red-600 mb-2">틀린 문제 ({results.wrongAnswers.length}개)</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {results.wrongAnswers.map((w) => (
                      <div key={w.number} className="flex gap-2">
                        <span className="font-medium">#{w.number}</span>
                        <span className="text-red-500">{w.userAnswer || '-'}</span>
                        <span className="text-green-600">({w.correctAnswer})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                오답이 기록되었습니다.
              </div>
            </>
          )}

          <Button variant="outline" className="w-full" onClick={() => { setResults(null); setAnswers({}); }}>
            다시 풀기
          </Button>
        </div>
      )}
    </div>
  );
}
