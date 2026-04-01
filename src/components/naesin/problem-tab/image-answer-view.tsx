'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemSheet } from '@/types/database';
import { useProblemDraft } from '@/hooks/use-problem-draft';
import type { ImageAnswerDraft } from '@/hooks/use-problem-draft';

export function ImageAnswerView({
  sheet,
  unitId,
  onComplete,
}: {
  sheet: NaesinProblemSheet;
  unitId: string;
  onComplete?: () => void;
}) {
  const totalQuestions = sheet.answer_key.length;
  const { loadDraft, saveDraft, clearDraft } = useProblemDraft(sheet.id, totalQuestions);

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const d = loadDraft();
    return d?.mode === 'image_answer' ? d.answers : {};
  });
  const [results, setResults] = useState<{ score: number; wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number }[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const answerArray = Array.from({ length: totalQuestions }, (_, i) => answers[i] || '');

    try {
      const data = await fetchWithToast<{ score: number; wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number }[] }>('/api/naesin/problems/submit', {
        body: {
          sheetId: sheet.id,
          unitId,
          answers: answerArray,
          totalQuestions,
        },
        errorMessage: '제출 중 오류가 발생했습니다',
        logContext: 'naesin.image_answer_view',
      });
      clearDraft();
      setResults({ score: data.score, wrongAnswers: data.wrongAnswers });
      if (data.score >= 80) {
        toast.success('문제풀이를 완료했습니다!');
        onComplete?.();
      }
    } catch {
      // error already toasted by fetchWithToast
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {sheet.pdf_url && (
        <div className="border rounded-lg overflow-hidden">
          <iframe
            src={sheet.pdf_url}
            className="w-full h-[500px]"
            title={sheet.title}
          />
        </div>
      )}

      {!results ? (
        <>
          <div className="space-y-3">
            <p className="text-sm font-medium">답 입력 ({totalQuestions}문항)</p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalQuestions }, (_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <Input
                    className="h-8 text-sm text-center"
                    value={answers[i] || ''}
                    onChange={(e) => {
                      const newAnswers = { ...answers, [i]: e.target.value };
                      setAnswers(newAnswers);
                      saveDraft({ mode: 'image_answer', answers: newAnswers });
                    }}
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
            {submitting ? '채점 중...' : '제출하기'}
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className={cn(
              'text-5xl font-bold',
              results.score >= 80 ? 'text-green-600' : results.score >= 50 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {results.score}점
            </p>
          </div>

          {results.wrongAnswers.length > 0 && (
            <>
              <Card>
                <CardContent className="py-4">
                  <p className="font-medium text-red-600 mb-2">틀린 문제 ({results.wrongAnswers.length}개)</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {results.wrongAnswers.map((w) => (
                      <div key={w.number} className="flex gap-2">
                        <span className="font-medium">#{w.number}</span>
                        <span className="text-red-500">{w.userAnswer || '-'}</span>
                        <span className="text-green-600">({w.correctAnswer})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                오답이 기록되었습니다.
              </div>
            </>
          )}

          <Button variant="outline" className="w-full" onClick={() => { clearDraft(); setResults(null); setAnswers({}); }}>
            다시 풀기
          </Button>
        </div>
      )}
    </div>
  );
}
