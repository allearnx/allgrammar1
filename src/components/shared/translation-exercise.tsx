'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle, RotateCcw, Info } from 'lucide-react';
import type { TextbookPassage } from '@/types/database';

// ── 룰 기반 채점 유틸 ──

/** 정규화: 소문자, 구두점 제거(아포스트로피 유지), 공백 통일 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 단어 배열의 LCS(최장 공통 부분수열) 길이 */
function lcsLength(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/** 원문과 학생 답안 비교 → 점수(0~100) */
function gradeAnswer(original: string, student: string): number {
  const normOrig = normalize(original);
  const normStudent = normalize(student);

  if (normOrig === normStudent) return 100;

  const origWords = normOrig.split(' ');
  const studentWords = normStudent.split(' ');

  if (origWords.length === 0) return 0;

  const matchedCount = lcsLength(origWords, studentWords);
  const score = Math.round((matchedCount / origWords.length) * 100);

  return Math.min(score, 100);
}

/** 점수에 따른 피드백 메시지 */
function getFeedback(score: number): string {
  if (score === 100) return '완벽합니다!';
  if (score >= 90) return '거의 맞았어요! 조금만 더 확인해보세요.';
  if (score >= 70) return '잘 쓰고 있어요. 빠진 부분을 확인하세요.';
  if (score >= 50) return '절반 이상 맞았어요. 원문을 다시 확인하세요.';
  return '원문을 다시 읽고 도전해보세요.';
}

// ── 타입 ──

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

// ── 메인 컴포넌트 ──

export function TranslationExercise({ passage, onComplete, showWrongAlert }: TranslationExerciseProps) {
  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;

  if (hasSentences) {
    return (
      <SentenceBysentenceTranslation
        passage={passage}
        onComplete={onComplete}
        showWrongAlert={showWrongAlert}
      />
    );
  }

  return (
    <WholePassageTranslation
      passage={passage}
      onComplete={onComplete}
      showWrongAlert={showWrongAlert}
    />
  );
}

// ── 문장별 영작 ──

function SentenceBysentenceTranslation({ passage, onComplete, showWrongAlert }: TranslationExerciseProps) {
  const sentences = passage.sentences!;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, GradingResult> | null>(null);

  function updateAnswer(idx: number, value: string) {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  }

  const filledCount = sentences.filter((_, idx) => (answers[idx] || '').trim().length > 0).length;
  const allFilled = filledCount === sentences.length;

  function handleSubmit() {
    if (!allFilled) return;

    const gradeResults: GradingResult[] = sentences.map((s, idx) => {
      const studentAnswer = (answers[idx] || '').trim();
      const score = gradeAnswer(s.original, studentAnswer);
      return {
        score,
        feedback: getFeedback(score),
        correctedSentence: s.original,
      };
    });

    const resultMap: Record<number, GradingResult> = {};
    gradeResults.forEach((r, idx) => { resultMap[idx] = r; });
    setResults(resultMap);

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
          한국어 해석을 보고 영어 원문을 그대로 작성하세요.
        </p>
      </div>

      {sentences.map((s, idx) => {
        const result = results?.[idx];
        return (
          <Card key={idx} className={result ? (result.score >= 80 ? 'border-green-500' : 'border-red-500') : ''}>
            <CardContent className="py-3 px-4 space-y-2">
              <p className="text-sm text-muted-foreground">{s.korean}</p>
              {results === null ? (
                <Textarea
                  className="text-sm min-h-[2.5rem] resize-none"
                  rows={1}
                  value={answers[idx] || ''}
                  onChange={(e) => updateAnswer(idx, e.target.value)}
                  placeholder="영어로 작성..."
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
                  {result.score < 100 && (
                    <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground">{result.feedback}</p>
                      <p className="font-medium">정답: {result.correctedSentence}</p>
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
          <Button onClick={handleSubmit} className="w-full" disabled={!allFilled}>
            <Send className="h-4 w-4 mr-1" />제출하기 ({filledCount}/{sentences.length})
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

// ── 전체 본문 영작 (fallback) ──

function WholePassageTranslation({ passage, onComplete, showWrongAlert }: TranslationExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<GradingResult | null>(null);

  function handleSubmit() {
    if (!answer.trim()) return;

    const score = gradeAnswer(passage.original_text, answer.trim());
    const data: GradingResult = {
      score,
      feedback: getFeedback(score),
      correctedSentence: passage.original_text,
    };
    setResult(data);

    const wrongs: WrongTranslation[] = score < 80
      ? [{ type: 'translation', koreanText: passage.korean_translation, userAnswer: answer.trim(), score, feedback: data.feedback }]
      : [];
    onComplete(score, wrongs);
  }

  function handleReset() {
    setAnswer('');
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground mb-2">다음 한국어를 영어로 작성하세요:</p>
          <p className="text-lg font-medium whitespace-pre-wrap">{passage.korean_translation}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="영어로 작성하세요..."
          rows={4}
          disabled={result !== null}
          className="resize-none"
        />
        <div className="flex justify-end">
          {result !== null ? (
            <Button onClick={handleReset} variant="outline">다시 작성</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!answer.trim()}>
              <Send className="h-4 w-4 mr-1" />제출
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
                <p className="text-sm font-medium mb-1">정답:</p>
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
