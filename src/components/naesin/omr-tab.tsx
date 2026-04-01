'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { OmrSheet } from './omr-sheet';
import type { NaesinOmrSheet } from '@/types/database';

interface OmrTabProps {
  omrSheets: NaesinOmrSheet[];
  unitId: string;
  onStageComplete: () => void;
}

export function OmrTab({ omrSheets, unitId, onStageComplete }: OmrTabProps) {
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

  if (omrSheets.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 OMR 시트가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {omrSheets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {omrSheets.map((sheet, idx) => (
            <button
              type="button"
              key={sheet.id}
              onClick={() => setCurrentSheetIndex(idx)}
              className={`shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                idx === currentSheetIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border'
              }`}
            >
              {sheet.title}
            </button>
          ))}
        </div>
      )}

      <OmrSheetView
        key={omrSheets[currentSheetIndex].id}
        sheet={omrSheets[currentSheetIndex]}
        unitId={unitId}
        onStageComplete={onStageComplete}
      />
    </div>
  );
}

interface OmrSheetViewProps {
  sheet: NaesinOmrSheet;
  unitId: string;
  onStageComplete: () => void;
}

function OmrSheetView({ sheet, unitId, onStageComplete }: OmrSheetViewProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<Record<number, boolean> | null>(null);
  const [scoreResult, setScoreResult] = useState<{ correct: number; total: number; percent: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answerKey = sheet.answer_key as number[];
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

    // Grade locally
    const newResults: Record<number, boolean> = {};
    let correctCount = 0;
    for (let i = 0; i < sheet.total_questions; i++) {
      const isCorrect = answers[i] === answerKey[i];
      newResults[i] = isCorrect;
      if (isCorrect) correctCount++;
    }

    const percent = Math.round((correctCount / sheet.total_questions) * 100);
    setResults(newResults);
    setScoreResult({ correct: correctCount, total: sheet.total_questions, percent });

    // Save to server
    try {
      const studentAnswers = Array.from({ length: sheet.total_questions }, (_, i) => answers[i] || 0);
      const data = await fetchWithToast<{ omrCompleted?: boolean }>('/api/naesin/omr/submit', {
        body: {
          unitId,
          omrSheetId: sheet.id,
          studentAnswers,
          correctCount,
          totalQuestions: sheet.total_questions,
          scorePercent: percent,
        },
        errorMessage: '제출 중 오류가 발생했습니다',
        logContext: 'naesin.omr_tab',
      });
      if (data.omrCompleted) {
        toast.success('OMR 시트 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch {
      // error already toasted by fetchWithToast
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
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">{sheet.title}</h3>
            </div>
            <Badge variant="secondary">{sheet.total_questions}문항</Badge>
          </div>

          {scoreResult && (
            <div className={`mt-3 p-3 rounded-lg text-center ${
              scoreResult.percent >= 80 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
            }`}>
              <p className="text-lg font-bold">{scoreResult.percent}점</p>
              <p className="text-sm">{scoreResult.correct}/{scoreResult.total} 정답</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <OmrSheet
            totalQuestions={sheet.total_questions}
            answers={answers}
            results={results}
            answerKey={answerKey}
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
            {submitting ? '제출 중...' : `제출하기 (${answeredCount}/${sheet.total_questions})`}
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
