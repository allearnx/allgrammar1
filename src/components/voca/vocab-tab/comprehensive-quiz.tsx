'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { VocaVocabulary } from '@/types/voca';
import {
  generateQuestions,
  type MCQuestion,
  type ShortQuestion,
  type AIQuestion,
  type QuestionResult,
} from './comprehensive-quiz-generator';
import { QuestionRenderer, QuestionTypeBadge } from './comprehensive-quiz-renderer';

interface ComprehensiveQuizProps {
  vocabulary: VocaVocabulary[];
  dayId: string;
  onComplete: (score: number, wrongWords?: string[]) => void;
}

export function ComprehensiveQuiz({ vocabulary, dayId: _dayId, onComplete }: ComprehensiveQuizProps) {
  const questionRef = useRef<HTMLDivElement>(null);
  const questions = useMemo(() => generateQuestions(vocabulary), [vocabulary]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [results, setResults] = useState<QuestionResult[] | null>(null);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentIdx]);

  if (questions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        유의어/반의어/숙어 데이터가 부족하여 종합 문제를 출제할 수 없습니다.
      </p>
    );
  }

  const question = questions[currentIdx];
  const totalQuestions = questions.length;

  function handleAnswer(answer: string) {
    setAnswers((prev) => new Map(prev).set(currentIdx, answer));
  }

  function handleNext() {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  }

  async function handleSubmit() {
    setGrading(true);

    try {
      const questionResults: QuestionResult[] = [];
      const aiQuestions: { idx: number; question: AIQuestion; answer: string }[] = [];

      // 1) Grade rule-based questions locally
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const answer = answers.get(i) || '';

        if (q.type === 'mc_synonym' || q.type === 'mc_antonym') {
          const mcQ = q as MCQuestion;
          const isCorrect = answer === String(mcQ.correctIndex);
          questionResults[i] = {
            question: q,
            studentAnswer: answer ? mcQ.choices[parseInt(answer)] : '(미응답)',
            score: isCorrect ? 100 : 0,
            feedback: isCorrect ? '정답!' : `정답: ${mcQ.reference}`,
          };
        } else if (q.type === 'short_synonym' || q.type === 'short_antonym' || q.type === 'fill_blank') {
          const shortQ = q as ShortQuestion;
          const trimmed = answer.trim().toLowerCase();
          const isCorrect = shortQ.acceptedAnswers.includes(trimmed);
          questionResults[i] = {
            question: q,
            studentAnswer: answer || '(미응답)',
            score: isCorrect ? 100 : 0,
            feedback: isCorrect ? '정답!' : `정답: ${shortQ.reference}`,
          };
        } else {
          // AI question - collect for batch
          aiQuestions.push({ idx: i, question: q as AIQuestion, answer });
        }
      }

      // 2) Grade AI questions in batch
      if (aiQuestions.length > 0) {
        try {
          const data = await fetchWithToast<{ results: { score: number; feedback: string }[] }>(
            '/api/voca/idiom-grade',
            {
              body: {
                questions: aiQuestions.map((aq) => ({
                  type: aq.question.type,
                  prompt: aq.question.prompt,
                  reference: aq.question.reference,
                  studentAnswer: aq.answer || '',
                })),
              },
              silent: true,
            },
          );
          aiQuestions.forEach((aq, arrIdx) => {
            const result = data.results[arrIdx];
            questionResults[aq.idx] = {
              question: aq.question,
              studentAnswer: aq.answer || '(미응답)',
              score: result.score,
              feedback: result.feedback,
            };
          });
        } catch {
          aiQuestions.forEach((aq) => {
            questionResults[aq.idx] = {
              question: aq.question,
              studentAnswer: aq.answer || '(미응답)',
              score: 0,
              feedback: '채점 오류',
            };
          });
        }
      }

      setResults(questionResults);

      // Calculate total score
      const totalScore = Math.round(
        questionResults.reduce((sum, r) => sum + r.score, 0) / questionResults.length
      );
      const wrongWords = questionResults
        .filter((r) => r.score < 80)
        .map((r) => r.question.word);
      onComplete(totalScore, wrongWords);
    } catch (err) {
      logger.error('voca.comprehensive_quiz', { error: err instanceof Error ? err.message : String(err) });
      toast.error('채점 중 오류가 발생했습니다');
    } finally {
      setGrading(false);
    }
  }

  function handleRestart() {
    setCurrentIdx(0);
    setAnswers(new Map());
    setResults(null);
  }

  // ── Results View ──
  if (results) {
    const totalScore = Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    );
    const correctCount = results.filter((r) => r.score >= 80).length;

    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold">{totalScore}점</p>
          <p className="text-muted-foreground">
            {results.length}문제 중 {correctCount}문제 정답
          </p>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {results.map((r, i) => (
            <Card key={i} className={cn(
              'border-l-4',
              r.score >= 80 ? 'border-l-green-500' : r.score >= 50 ? 'border-l-yellow-500' : 'border-l-red-500'
            )}>
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  {r.score >= 80 ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium whitespace-pre-line">{r.question.prompt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      내 답: {r.studentAnswer}
                    </p>
                    <p className="text-xs mt-0.5">
                      {r.feedback}
                    </p>
                  </div>
                  <QuestionTypeBadge type={r.question.type} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" className="w-full" onClick={handleRestart}>
          <RotateCcw className="h-4 w-4 mr-2" />
          다시 풀기
        </Button>
      </div>
    );
  }

  // ── Quiz View ──
  const answeredCount = answers.size;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-6">
      {/* Sticky header: progress + nav */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-3 space-y-3 -mx-1 px-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{currentIdx + 1} / {totalQuestions}</span>
          <QuestionTypeBadge type={question.type} />
        </div>
        <Progress value={progressPct} className="h-1.5" />
        {/* Question navigation dots */}
        <div className="flex flex-wrap gap-1 justify-center">
          {questions.map((_, i) => (
            <button
              key={i}
              className={cn(
                'w-6 h-6 rounded-full text-xs border transition-colors',
                i === currentIdx && 'ring-2 ring-primary',
                answers.has(i) ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
              onClick={() => setCurrentIdx(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <Card ref={questionRef}>
        <CardContent className="py-6">
          <QuestionRenderer
            question={question}
            answer={answers.get(currentIdx) || ''}
            onAnswer={handleAnswer}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIdx === 0}>
          이전
        </Button>
        <div className="flex gap-2">
          {currentIdx < totalQuestions - 1 ? (
            <Button size="sm" onClick={handleNext}>
              다음
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={grading}
            >
              {grading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  채점 중...
                </>
              ) : (
                '제출하기'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
