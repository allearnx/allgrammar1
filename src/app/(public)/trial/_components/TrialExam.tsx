'use client';

import { useState, useCallback } from 'react';
import { EXAM_SETS } from '../_data';
import type { ExamSet } from '../_data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { gradeSubjective, flattenQuestions } from '@/lib/trial-exam-utils';
import { ExamSelector } from './ExamSelector';
import { QuestionView } from './QuestionView';
import { ResultsSummary } from './ResultsSummary';

export default function TrialExam() {
  const [selectedExam, setSelectedExam] = useState<ExamSet | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, { correct: boolean; correctAnswer: string }> | null>(null);

  const items = selectedExam ? flattenQuestions(selectedExam.sections) : [];

  // De-duplicate passages: only show passage on the first question of each passage group
  const passageShown = new Set<string>();

  const handleAnswer = useCallback((qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedExam) return;
    const newResults: Record<number, { correct: boolean; correctAnswer: string }> = {};

    for (const item of items) {
      const q = item.question;
      const userAnswer = answers[q.id] ?? '';

      if (q.type === 'mc') {
        if (Array.isArray(q.answer)) {
          const correctKey = q.answer.map(String).sort().join(',');
          const userKey = userAnswer.split(',').filter(Boolean).sort().join(',');
          newResults[q.id] = { correct: correctKey === userKey, correctAnswer: correctKey };
        } else {
          const correct = String(q.answer) === userAnswer;
          newResults[q.id] = { correct, correctAnswer: String(q.answer) };
        }
      } else {
        const correct = gradeSubjective(userAnswer, q.answer, q.acceptableAnswers);
        newResults[q.id] = { correct, correctAnswer: q.answer };
      }
    }

    setResults(newResults);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedExam, items, answers]);

  const handleReset = useCallback(() => {
    setSelectedExam(null);
    setAnswers({});
    setResults(null);
    window.scrollTo({ top: 0 });
  }, []);

  if (!selectedExam) {
    return <ExamSelector onSelect={setSelectedExam} />;
  }

  const totalQuestions = items.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = results
    ? Object.values(results).filter((r) => r.correct).length
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600 mb-1">
            ← 시험 선택
          </button>
          <h1 className="text-xl font-bold text-gray-900">{selectedExam.label}</h1>
        </div>
        {!results && (
          <Badge variant="outline" className="text-sm">
            {answeredCount}/{totalQuestions} 답변
          </Badge>
        )}
      </div>

      {/* Results Summary */}
      {results && (
        <div className="mb-8">
          <ResultsSummary
            totalQuestions={totalQuestions}
            correctCount={correctCount}
            onReset={handleReset}
          />
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {items.map((item, idx) => {
          // De-duplicate passage display
          let passageToShow = item.passage;
          if (passageToShow) {
            if (passageShown.has(passageToShow)) {
              passageToShow = undefined;
            } else {
              passageShown.add(passageToShow);
            }
          }

          return (
            <QuestionView
              key={item.question.id}
              item={{ ...item, passage: passageToShow }}
              index={idx}
              userAnswer={answers[item.question.id] ?? ''}
              onAnswer={(val) => handleAnswer(item.question.id, val)}
              result={results?.[item.question.id]}
            />
          );
        })}
      </div>

      {/* Submit Button */}
      {!results && (
        <div className="sticky bottom-4 mt-6">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full shadow-lg"
            disabled={answeredCount === 0}
          >
            채점하기 ({answeredCount}/{totalQuestions})
          </Button>
          <p className="text-center text-xs text-gray-400 mt-2">
            서술형은 띄어쓰기나 마침표 차이로 오답 처리될 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
