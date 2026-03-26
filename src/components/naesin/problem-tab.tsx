'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { MCQOptionList } from '@/components/shared/mcq-option-list';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/naesin';

interface ProblemTabProps {
  sheets: NaesinProblemSheet[];
  unitId: string;
  onStageComplete?: () => void;
}

export function ProblemTab({ sheets, unitId, onStageComplete }: ProblemTabProps) {
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

  if (sheets.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 문제가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sheets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sheets.map((sheet, idx) => (
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

      <SheetView
        key={sheets[currentSheetIndex].id}
        sheet={sheets[currentSheetIndex]}
        unitId={unitId}
        onStageComplete={onStageComplete}
      />
    </div>
  );
}

// ============================================
// Single Sheet View
// ============================================

interface SheetViewProps {
  sheet: NaesinProblemSheet;
  unitId: string;
  onStageComplete?: () => void;
}

function SheetView({ sheet, unitId, onStageComplete }: SheetViewProps) {
  const questions = sheet.questions as NaesinProblemQuestion[];

  if (sheet.mode === 'image_answer') {
    return (
      <ImageAnswerView sheet={sheet} unitId={unitId} onStageComplete={onStageComplete} />
    );
  }

  return (
    <InteractiveView
      sheet={sheet}
      questions={questions}
      unitId={unitId}
      onStageComplete={onStageComplete}
    />
  );
}

// ============================================
// Interactive Mode — questions displayed on screen
// ============================================

function InteractiveView({
  sheet,
  questions,
  unitId,
  onStageComplete,
}: {
  sheet: NaesinProblemSheet;
  questions: NaesinProblemQuestion[];
  unitId: string;
  onStageComplete?: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [aiResults, setAiResults] = useState<Record<string, { score: number; feedback: string; correctedAnswer: string }>>({});
  const [gradingIndices, setGradingIndices] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string; aiFeedback?: { score: number; feedback: string; correctedAnswer: string } }[];
  } | null>(null);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  function handleMcqSelect(qIndex: number, value: string | number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  }

  function handleSubjectiveChange(qIndex: number, value: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  }

  async function gradeSubjective(qIndex: number, question: NaesinProblemQuestion) {
    const studentAnswer = String(answers[qIndex] ?? '').trim();
    if (!studentAnswer) return;

    setGradingIndices((prev) => new Set(prev).add(qIndex));
    try {
      const res = await fetch('/api/naesin/problems/grade-subjective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          referenceAnswer: String(question.answer),
          studentAnswer,
        }),
      });
      if (!res.ok) throw new Error('AI grading failed');
      const data = await res.json();
      setAiResults((prev) => ({ ...prev, [String(qIndex)]: data }));
    } catch (err) {
      logger.error('naesin.problem_tab.grade', { error: err instanceof Error ? err.message : String(err) });
      toast.error('AI 채점 중 오류가 발생했습니다.');
    } finally {
      setGradingIndices((prev) => {
        const next = new Set(prev);
        next.delete(qIndex);
        return next;
      });
    }
  }

  async function handleSubmit() {
    // Check all subjective questions are AI-graded
    const ungraded: number[] = [];
    for (let i = 0; i < questions.length; i++) {
      const isSubjective = !questions[i].options || questions[i].options!.length === 0;
      const hasAnswer = String(answers[i] ?? '').trim() !== '';
      if (isSubjective && hasAnswer && !aiResults[String(i)]) {
        ungraded.push(i);
      }
    }

    // Auto-grade ungraded subjective questions
    if (ungraded.length > 0) {
      toast.info('서술형 답안을 AI 채점 중입니다...');
      await Promise.all(ungraded.map((i) => gradeSubjective(i, questions[i])));
    }

    if (answeredCount < totalQuestions) {
      toast.error(`모든 문항에 답을 입력해주세요 (${answeredCount}/${totalQuestions})`);
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = Array.from({ length: totalQuestions }, (_, i) => answers[i] ?? '');
      const res = await fetch('/api/naesin/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: sheet.id,
          unitId,
          answers: answersArray,
          totalQuestions,
          aiResults: Object.keys(aiResults).length > 0 ? aiResults : undefined,
        }),
      });
      const data = await res.json();
      setResult({ score: data.score, correctCount: data.correctCount, wrongAnswers: data.wrongAnswers });
      setSubmitted(true);
      if (onStageComplete) onStageComplete();
    } catch (err) {
      logger.error('naesin.problem_tab.submit', { error: err instanceof Error ? err.message : String(err) });
      toast.error('제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setAnswers({});
    setAiResults({});
    setSubmitted(false);
    setResult(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-500" />
              <h3 className="font-medium">{sheet.title}</h3>
            </div>
            <Badge variant="secondary">{totalQuestions}문항</Badge>
          </div>

          {result && (
            <div className={`mt-3 p-3 rounded-lg text-center ${
              result.score >= 80 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
            }`}>
              <p className="text-lg font-bold">{result.score}점</p>
              <p className="text-sm">{result.correctCount}/{totalQuestions} 정답</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const isSubjective = !q.options || q.options.length === 0;
          const isGrading = gradingIndices.has(idx);
          const aiResult = aiResults[String(idx)];

          return (
            <Card key={idx}>
              <CardContent className="py-4 space-y-3">
                <p className="font-medium">
                  <span className="text-muted-foreground mr-2">{q.number || idx + 1}.</span>
                  {q.question}
                </p>

                {!isSubjective ? (
                  <MCQOptionList
                    options={q.options!}
                    selectedAnswer={answers[idx] ?? null}
                    correctAnswer={String(q.answer)}
                    showResult={submitted}
                    onSelect={(v) => handleMcqSelect(idx, v)}
                  />
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="답을 입력하세요"
                      value={String(answers[idx] ?? '')}
                      onChange={(e) => handleSubjectiveChange(idx, e.target.value)}
                      disabled={submitted}
                    />
                    {!submitted && String(answers[idx] ?? '').trim() && !aiResult && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => gradeSubjective(idx, q)}
                        disabled={isGrading}
                      >
                        {isGrading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            채점 중...
                          </>
                        ) : 'AI 채점'}
                      </Button>
                    )}
                    {aiResult && (
                      <div className={`p-3 rounded-lg text-sm ${
                        aiResult.score >= 80 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        <p className="font-medium">AI 점수: {aiResult.score}점</p>
                        <p className="mt-1">{aiResult.feedback}</p>
                        {aiResult.correctedAnswer && (
                          <p className="mt-1 text-xs opacity-75">모범답안: {aiResult.correctedAnswer}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {submitted && q.explanation && (
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">
                    <span className="font-medium">해설:</span> {q.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2">
        {!submitted ? (
          <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                제출 중...
              </>
            ) : `제출하기 (${answeredCount}/${totalQuestions})`}
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

// ============================================
// Image+Answer Mode — PDF view + answer input
// ============================================

function ImageAnswerView({
  sheet,
  unitId,
  onStageComplete,
}: {
  sheet: NaesinProblemSheet;
  unitId: string;
  onStageComplete?: () => void;
}) {
  const totalQuestions = sheet.answer_key.length;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number }[];
  } | null>(null);

  const answeredCount = Object.values(answers).filter((v) => v.trim() !== '').length;

  function handleAnswerChange(idx: number, value: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  }

  async function handleSubmit() {
    if (answeredCount < totalQuestions) {
      toast.error(`모든 문항에 답을 입력해주세요 (${answeredCount}/${totalQuestions})`);
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = Array.from({ length: totalQuestions }, (_, i) => answers[i] ?? '');
      const res = await fetch('/api/naesin/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: sheet.id,
          unitId,
          answers: answersArray,
          totalQuestions,
        }),
      });
      const data = await res.json();
      setResult({ score: data.score, correctCount: data.correctCount, wrongAnswers: data.wrongAnswers });
      setSubmitted(true);
      if (onStageComplete) onStageComplete();
    } catch (err) {
      logger.error('naesin.problem_tab.image_submit', { error: err instanceof Error ? err.message : String(err) });
      toast.error('제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-500" />
              <h3 className="font-medium">{sheet.title}</h3>
            </div>
            <Badge variant="secondary">{totalQuestions}문항</Badge>
          </div>

          {result && (
            <div className={`mt-3 p-3 rounded-lg text-center ${
              result.score >= 80 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
            }`}>
              <p className="text-lg font-bold">{result.score}점</p>
              <p className="text-sm">{result.correctCount}/{totalQuestions} 정답</p>
            </div>
          )}
        </CardContent>
      </Card>

      {sheet.pdf_url && (
        <Card>
          <CardContent className="py-4">
            <iframe
              src={sheet.pdf_url}
              className="w-full h-[500px] rounded-lg border"
              title={sheet.title}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4">
          <h4 className="font-medium mb-3">답안 입력</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const isWrong = submitted && result?.wrongAnswers.some((w) => w.number === i + 1);
              const isCorrect = submitted && !isWrong;

              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6 text-right shrink-0">
                    {i + 1}.
                  </span>
                  <Input
                    value={answers[i] ?? ''}
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                    disabled={submitted}
                    className={`h-9 ${
                      isCorrect ? 'border-green-500 bg-green-50' :
                      isWrong ? 'border-red-500 bg-red-50' : ''
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {submitted && result && result.wrongAnswers.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-red-600">오답:</p>
              {result.wrongAnswers.map((w) => (
                <p key={w.number} className="text-sm text-muted-foreground">
                  {w.number}번: 내 답 <span className="text-red-600">{String(w.userAnswer)}</span> → 정답 <span className="text-green-600">{String(w.correctAnswer)}</span>
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {!submitted ? (
          <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                제출 중...
              </>
            ) : `제출하기 (${answeredCount}/${totalQuestions})`}
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
