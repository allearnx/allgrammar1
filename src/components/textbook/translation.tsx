'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveProgress } from '@/hooks/use-save-progress';
import type { TextbookPassage, StudentTextbookProgress } from '@/types/database';

interface TranslationViewProps {
  passage: TextbookPassage;
  progress?: StudentTextbookProgress | null;
}

interface GradingResult {
  score: number;
  feedback: string;
  correctedSentence: string;
}

export function TranslationView({ passage, progress }: TranslationViewProps) {
  const { saveTextbookProgress } = useSaveProgress();
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [attempts, setAttempts] = useState(0);

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
      setAttempts((prev) => prev + 1);

      saveTextbookProgress(passage.id, 'translation', data.score);
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
          <p className="text-lg font-medium whitespace-pre-wrap">
            {passage.korean_translation}
          </p>
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
          <span className="text-xs text-muted-foreground">
            AI 채점 (시간당 10회 제한)
          </span>
          {result !== null ? (
            <Button onClick={handleReset} variant="outline">
              다시 작성
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!answer.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  채점 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  제출
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {result && (
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
      )}
    </div>
  );
}
