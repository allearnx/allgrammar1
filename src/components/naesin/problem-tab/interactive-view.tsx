'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MCQOptionList } from '@/components/shared/mcq-option-list';
import { toast } from 'sonner';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/database';

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
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '결과 저장에 실패했습니다');
      }
      const data = await res.json();
      setFinished(true);
      if (data.score >= 80) {
        toast.success('문제풀이를 완료했습니다!');
        onComplete?.();
      }
    } catch {
      toast.error('결과 저장에 실패했습니다');
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
        <MCQOptionList
          options={question.options}
          selectedAnswer={selectedAnswer}
          correctAnswer={String(question.answer)}
          showResult={showResult}
          onSelect={(v) => handleSelect(v as string)}
          className="max-w-lg mx-auto"
        />
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
