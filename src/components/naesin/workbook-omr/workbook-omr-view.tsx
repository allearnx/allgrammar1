'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { OmrSheet } from '@/components/naesin/omr-sheet';
import type { NaesinWorkbookOmrSheet, NaesinWorkbookOmrAttempt } from '@/types/naesin';

interface WorkbookOmrViewProps {
  sheet: NaesinWorkbookOmrSheet;
  onSubmitComplete: (attempt: NaesinWorkbookOmrAttempt) => void;
}

export function WorkbookOmrView({ sheet, onSubmitComplete }: WorkbookOmrViewProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<Record<number, boolean> | null>(null);
  const [scoreResult, setScoreResult] = useState<{ correct: number; total: number; percent: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = Object.keys(answers).length;

  function handleSelect(questionIndex: number, optionNum: number) {
    if (results) return;
    setAnswers((prev) => {
      const next = { ...prev };
      if (next[questionIndex] === optionNum) {
        delete next[questionIndex];
      } else {
        next[questionIndex] = optionNum;
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (answeredCount < sheet.total_questions) {
      toast.error(`모든 문항에 답을 선택해주세요 (${answeredCount}/${sheet.total_questions})`);
      return;
    }

    setSubmitting(true);

    const studentAnswers = Array.from({ length: sheet.total_questions }, (_, i) => answers[i] || 0);

    try {
      const res = await fetch('/api/naesin/workbook-omr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ omrSheetId: sheet.id, studentAnswers }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      // Show results with answer key from server
      const answerKey = data.answer_key as number[];
      const newResults: Record<number, boolean> = {};
      for (let i = 0; i < sheet.total_questions; i++) {
        newResults[i] = studentAnswers[i] === answerKey[i];
      }

      setResults(newResults);
      setScoreResult({
        correct: data.correct_count,
        total: data.total_questions,
        percent: data.score_percent,
      });

      onSubmitComplete(data);
      toast.success('채점 완료!');
    } catch {
      toast.error('제출 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setAnswers({});
    setResults(null);
    setScoreResult(null);
  }

  return (
    <div className="space-y-4">
      {scoreResult && (
        <Card>
          <CardContent className="py-4">
            <div className={`p-3 rounded-lg text-center ${
              scoreResult.percent >= 80 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
            }`}>
              <p className="text-lg font-bold">{scoreResult.percent}점</p>
              <p className="text-sm">{scoreResult.correct}/{scoreResult.total} 정답</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4">
          <OmrSheet
            totalQuestions={sheet.total_questions}
            answers={answers}
            results={results}
            answerKey={results ? sheet.answer_key : undefined}
            disabled={results !== null}
            onSelect={handleSelect}
          />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {results === null ? (
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={submitting}
          >
            {submitting ? '채점 중...' : `제출하기 (${answeredCount}/${sheet.total_questions})`}
          </Button>
        ) : (
          <Button onClick={handleReset} variant="outline" className="flex-1">
            다시 풀기
          </Button>
        )}
      </div>
    </div>
  );
}
