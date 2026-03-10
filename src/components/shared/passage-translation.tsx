'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle } from 'lucide-react';
import { gradeAnswerLCS, getFeedbackLCS } from '@/lib/utils/lcs-grader';
import type { TranslationExerciseProps, GradingResult, WrongTranslation } from './translation-exercise';

export function WholePassageTranslation({ passage, onComplete, showWrongAlert }: TranslationExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<GradingResult | null>(null);

  function handleSubmit() {
    if (!answer.trim()) return;
    const score = gradeAnswerLCS(passage.original_text, answer.trim());
    const data: GradingResult = {
      score,
      feedback: getFeedbackLCS(score),
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
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          placeholder="영어로 작성하세요..."
          rows={4}
          disabled={result !== null}
          autoComplete="off"
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
