'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, AlertTriangle, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { TextbookPassage } from '@/types/database';

interface GradingResult {
  score: number;
  feedback: string;
  correctedSentence: string;
}

interface WrongTranslation {
  type: 'translation';
  koreanText: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

interface TranslationExerciseProps {
  passage: TextbookPassage;
  onComplete: (score: number, wrongAnswers: WrongTranslation[]) => void;
  showWrongAlert?: boolean;
  rateLimitText?: string;
}

export function TranslationExercise({ passage, onComplete, showWrongAlert, rateLimitText = 'AI 채점' }: TranslationExerciseProps) {
  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;

  if (hasSentences) {
    return (
      <SentenceBysentenceTranslation
        passage={passage}
        onComplete={onComplete}
        showWrongAlert={showWrongAlert}
        rateLimitText={rateLimitText}
      />
    );
  }

  return (
    <WholePassageTranslation
      passage={passage}
      onComplete={onComplete}
      showWrongAlert={showWrongAlert}
      rateLimitText={rateLimitText}
    />
  );
}

/** 문장별 영작 (sentences 데이터가 있을 때) */
function SentenceBysentenceTranslation({ passage, onComplete, showWrongAlert, rateLimitText }: TranslationExerciseProps) {
  const sentences = passage.sentences!;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<number, GradingResult> | null>(null);

  function updateAnswer(idx: number, value: string) {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  }

  const filledCount = sentences.filter((_, idx) => (answers[idx] || '').trim().length > 0).length;
  const allFilled = filledCount === sentences.length;

  async function handleSubmit() {
    if (!allFilled || loading) return;
    setLoading(true);

    try {
      // Grade all sentences in parallel
      const gradePromises = sentences.map((s, idx) =>
        fetch('/api/textbook/grade-translation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passageId: passage.id,
            koreanText: s.korean,
            originalText: s.original,
            studentAnswer: (answers[idx] || '').trim(),
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error('채점 실패');
          return res.json() as Promise<GradingResult>;
        })
      );

      const gradeResults = await Promise.all(gradePromises);

      const resultMap: Record<number, GradingResult> = {};
      gradeResults.forEach((r, idx) => { resultMap[idx] = r; });
      setResults(resultMap);

      // Calculate overall score (average)
      const totalScore = Math.round(
        gradeResults.reduce((sum, r) => sum + r.score, 0) / gradeResults.length
      );

      const wrongs: WrongTranslation[] = gradeResults
        .map((r, idx) => r.score < 80 ? {
          type: 'translation' as const,
          koreanText: sentences[idx].korean,
          userAnswer: (answers[idx] || '').trim(),
          score: r.score,
          feedback: r.feedback,
        } : null)
        .filter((w): w is WrongTranslation => w !== null);

      onComplete(totalScore, wrongs);
    } catch (error) {
      toast.error('채점 중 오류가 발생했습니다', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setAnswers({});
    setResults(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
        <Info className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          한국어 해석을 보고 영어로 작성하세요. {rateLimitText}
        </p>
      </div>

      {sentences.map((s, idx) => {
        const result = results?.[idx];
        const isEmpty = results === null && !(answers[idx] || '').trim();
        return (
          <Card key={idx} className={result ? (result.score >= 80 ? 'border-green-500' : 'border-red-500') : ''}>
            <CardContent className="py-3 px-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="text-xs text-muted-foreground/60 mr-1">{idx + 1}.</span>
                {s.korean}
              </p>
              {results === null ? (
                <Textarea
                  className="text-sm min-h-[2.5rem] resize-none"
                  rows={1}
                  value={answers[idx] || ''}
                  onChange={(e) => updateAnswer(idx, e.target.value)}
                  placeholder="영어로 작성..."
                  disabled={loading}
                />
              ) : result ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{answers[idx]}</p>
                    <Badge
                      variant={result.score >= 80 ? 'default' : 'secondary'}
                      className={result.score >= 80 ? 'bg-green-500 shrink-0' : 'shrink-0'}
                    >
                      {result.score}점
                    </Badge>
                  </div>
                  {result.score < 80 && (
                    <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground">{result.feedback}</p>
                      <p className="font-medium">모범: {result.correctedSentence}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {results === null && !allFilled && filledCount > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {filledCount}/{sentences.length} 문장 작성 완료
        </p>
      )}

      <div className="flex gap-2">
        {results === null ? (
          <Button onClick={handleSubmit} className="w-full" disabled={!allFilled || loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" />채점 중...</>
            ) : (
              <><Send className="h-4 w-4 mr-1" />제출하기 ({filledCount}/{sentences.length})</>
            )}
          </Button>
        ) : (
          <Button onClick={handleReset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-1" />
            다시 풀기
          </Button>
        )}
      </div>

      {results && showWrongAlert && Object.values(results).some((r) => r.score < 80) && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          오답이 기록되었습니다. 오답을 써서 선생님에게 제출하세요.
        </div>
      )}
    </div>
  );
}

/** 전체 본문 영작 (sentences 데이터가 없을 때 — fallback) */
function WholePassageTranslation({ passage, onComplete, showWrongAlert, rateLimitText }: TranslationExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);

  async function handleSubmit() {
    if (!answer.trim() || loading) return;
    setLoading(true);

    try {
      const response = await fetch('/api/textbook/grade-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageId: passage.id,
          koreanText: passage.korean_translation,
          originalText: passage.original_text,
          studentAnswer: answer.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to grade');
      }

      const data = await response.json();
      setResult(data);

      const wrongs: WrongTranslation[] = data.score < 80
        ? [{ type: 'translation', koreanText: passage.korean_translation, userAnswer: answer.trim(), score: data.score, feedback: data.feedback }]
        : [];
      onComplete(data.score, wrongs);
    } catch (error) {
      toast.error('채점 중 오류가 발생했습니다', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setAnswer('');
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground mb-2">다음 한국어를 영어로 번역하세요:</p>
          <p className="text-lg font-medium whitespace-pre-wrap">{passage.korean_translation}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="영어로 번역하세요..."
          rows={4}
          disabled={loading || result !== null}
          className="resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{rateLimitText}</span>
          {result !== null ? (
            <Button onClick={handleReset} variant="outline">다시 작성</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!answer.trim() || loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />채점 중...</>
              ) : (
                <><Send className="h-4 w-4 mr-1" />제출</>
              )}
            </Button>
          )}
        </div>
      </div>

      {result && (
        <>
          <Card className={result.score >= 80 ? 'border-green-500' : result.score >= 50 ? 'border-yellow-500' : 'border-red-500'}>
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">채점 결과</span>
                <Badge
                  variant={result.score >= 80 ? 'default' : 'secondary'}
                  className={result.score >= 80 ? 'bg-green-500' : ''}
                >
                  {result.score}점
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">피드백:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.feedback}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">모범 답안:</p>
                <p className="text-sm whitespace-pre-wrap">{result.correctedSentence}</p>
              </div>
            </CardContent>
          </Card>

          {showWrongAlert && result.score < 80 && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              오답이 기록되었습니다. 오답을 써서 선생님에게 제출하세요.
            </div>
          )}
        </>
      )}
    </div>
  );
}
