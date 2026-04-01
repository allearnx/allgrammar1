'use client';

import { useState, useCallback } from 'react';
import { EXAM_SETS } from '../_data';
import type { ExamSet, Question } from '../_data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { gradeSubjective, flattenQuestions } from '@/lib/trial-exam-utils';

// ── Components ──

function ExamSelector({ onSelect }: { onSelect: (exam: ExamSet) => void }) {
  const grade2 = EXAM_SETS.filter((e) => e.grade === 2);
  const grade3 = EXAM_SETS.filter((e) => e.grade === 3);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-32 pb-12">
      <div className="text-center mb-10">
        <Badge variant="secondary" className="mb-3 text-sm">무료 체험</Badge>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">기출문제 풀어보기</h1>
        <p className="text-gray-500 text-lg">실제 중학교 영어 기출문제를 풀고 바로 채점해 보세요.</p>
      </div>

      <div className="space-y-8">
        {[{ label: '중학교 2학년', exams: grade2 }, { label: '중학교 3학년', exams: grade3 }].map(
          ({ label, exams }) => (
            <div key={label}>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">{label}</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {exams.map((exam) => {
                  const total = exam.sections.reduce((s, sec) => s + sec.questions.length, 0);
                  return (
                    <button
                      key={exam.id}
                      onClick={() => onSelect(exam)}
                      className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <p className="font-semibold text-gray-900">{exam.label}</p>
                      <p className="text-sm text-gray-400 mt-1">{total}문항</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-10">
        서술형은 띄어쓰기나 마침표 차이로 오답 처리될 수 있습니다.
      </p>
    </div>
  );
}

function QuestionView({
  item,
  index,
  userAnswer,
  onAnswer,
  result,
}: {
  item: { question: Question; passage?: string };
  index: number;
  userAnswer: string;
  onAnswer: (val: string) => void;
  result?: { correct: boolean; correctAnswer: string };
}) {
  const { question: q, passage } = item;
  const showPassage = passage && (index === 0 || true); // always show if present

  return (
    <Card className="p-5 sm:p-6">
      {/* Passage - only show once per passage group */}
      {showPassage && (
        <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line border border-gray-100">
          {passage}
        </div>
      )}

      {/* Question */}
      <div className="mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mr-2">
          {q.id}
        </span>
        <span className="font-medium text-gray-900 whitespace-pre-line">{q.question}</span>
      </div>

      {/* MC Options */}
      {q.type === 'mc' && q.options && (() => {
        const isMulti = Array.isArray(q.answer);
        const selectedSet = isMulti
          ? new Set(userAnswer ? userAnswer.split(',') : [])
          : new Set(userAnswer ? [userAnswer] : []);
        const correctSet = result
          ? new Set(result.correctAnswer.split(','))
          : new Set<string>();

        return (
          <div className="space-y-2 ml-9">
            {isMulti && !result && (
              <p className="text-xs text-blue-500 mb-1">복수 정답 — 정답을 모두 선택하세요</p>
            )}
            {q.options.map((opt, i) => {
              const optNum = String(i + 1);
              const isSelected = selectedSet.has(optNum);
              const isCorrect = result && correctSet.has(optNum);
              const isWrong = result && isSelected && !correctSet.has(optNum);

              let cls = 'border-gray-200 bg-white hover:border-blue-300';
              if (result) {
                if (isCorrect) cls = 'border-green-400 bg-green-50';
                else if (isWrong) cls = 'border-red-400 bg-red-50';
                else cls = 'border-gray-100 bg-gray-50 opacity-60';
              } else if (isSelected) {
                cls = 'border-blue-500 bg-blue-50';
              }

              const handleClick = () => {
                if (result) return;
                if (isMulti) {
                  const next = new Set(selectedSet);
                  if (next.has(optNum)) next.delete(optNum);
                  else next.add(optNum);
                  onAnswer([...next].sort().join(','));
                } else {
                  onAnswer(optNum);
                }
              };

              return (
                <button
                  key={i}
                  onClick={handleClick}
                  disabled={!!result}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${cls}`}
                >
                  {opt}
                  {result && isCorrect && <span className="float-right text-green-600">✓</span>}
                  {result && isWrong && <span className="float-right text-red-500">✗</span>}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Subjective Input */}
      {q.type === 'subjective' && (
        <div className="ml-9">
          <textarea
            value={userAnswer}
            onChange={(e) => !result && onAnswer(e.target.value)}
            disabled={!!result}
            placeholder="답을 입력하세요"
            rows={2}
            className={`w-full rounded-lg border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 ${
              result
                ? result.correct
                  ? 'border-green-400 bg-green-50'
                  : 'border-red-400 bg-red-50'
                : 'border-gray-200'
            }`}
          />
          {result && !result.correct && (
            <p className="mt-2 text-sm text-green-700">
              <span className="font-medium">정답:</span> {result.correctAnswer}
            </p>
          )}
          {result && result.correct && (
            <p className="mt-2 text-sm text-green-600 font-medium">정답입니다!</p>
          )}
        </div>
      )}
    </Card>
  );
}

function ResultsSummary({
  totalQuestions,
  correctCount,
  onReset,
}: {
  totalQuestions: number;
  correctCount: number;
  onReset: () => void;
}) {
  const pct = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="p-6 text-center">
        <p className="text-sm text-gray-500 mb-1">채점 결과</p>
        <p className="text-5xl font-bold text-blue-600 mb-1">
          {correctCount}<span className="text-2xl text-gray-400">/{totalQuestions}</span>
        </p>
        <p className="text-gray-500">{pct}점</p>
      </Card>

      {/* Locked 오답 분석 */}
      <div className="relative">
        <Card className="p-6 overflow-hidden">
          <div className="blur-sm select-none pointer-events-none">
            <h3 className="text-lg font-bold mb-3">오답 분석</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-gray-100" />
              ))}
            </div>
            <h3 className="text-lg font-bold mt-6 mb-3">유형별 추가 문제</h3>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>

          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <div className="text-center px-6">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-1">
                유료 회원은 오답 분석과 유형별 문제를 제공합니다!
              </p>
              <p className="text-sm text-gray-500 mb-4">
                틀린 문제를 분석하고, 비슷한 유형의 문제로 집중 연습하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link href="/signup">
                  <Button size="lg">무료 가입하기</Button>
                </Link>
                <Link href="/courses/school_exam">
                  <Button variant="outline" size="lg">올인내신 둘러보기</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={onReset}>
          다른 시험 풀기
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ──

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
