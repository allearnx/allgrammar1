'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { TextbookPassage, StudentTextbookProgress, BlankItem } from '@/types/database';

interface FillBlanksViewProps {
  passage: TextbookPassage;
  progress?: StudentTextbookProgress | null;
}

type Difficulty = 'easy' | 'medium' | 'hard';

export function FillBlanksView({ passage, progress }: FillBlanksViewProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean> | null>(null);

  const blanksMap: Record<Difficulty, BlankItem[] | null> = {
    easy: passage.blanks_easy as BlankItem[] | null,
    medium: passage.blanks_medium as BlankItem[] | null,
    hard: passage.blanks_hard as BlankItem[] | null,
  };

  const blanks = blanksMap[difficulty] || [];

  function handleSubmit() {
    if (blanks.length === 0) return;

    const newResults: Record<number, boolean> = {};
    let correctCount = 0;

    blanks.forEach((blank) => {
      const userAnswer = (answers[blank.index] || '').trim().toLowerCase();
      const correctAnswer = blank.answer.toLowerCase();
      const isCorrect = userAnswer === correctAnswer;
      newResults[blank.index] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setResults(newResults);
    const score = Math.round((correctCount / blanks.length) * 100);

    // Save progress
    fetch('/api/textbook/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passageId: passage.id,
        type: `fill_blanks_${difficulty}`,
        score,
      }),
    });

    toast(score >= 80 ? '잘했어요!' : '다시 도전해보세요!', {
      description: `${correctCount}/${blanks.length} 정답 (${score}점)`,
    });
  }

  function handleReset() {
    setAnswers({});
    setResults(null);
  }

  // Split text into segments with blanks
  const words = passage.original_text.split(/\s+/);
  const blankIndices = new Set(blanks.map((b) => b.index));

  return (
    <div className="space-y-4">
      <Tabs value={difficulty} onValueChange={(v) => { setDifficulty(v as Difficulty); handleReset(); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="easy">쉬움</TabsTrigger>
          <TabsTrigger value="medium" disabled={!passage.blanks_medium}>
            보통
          </TabsTrigger>
          <TabsTrigger value="hard" disabled={!passage.blanks_hard}>
            어려움
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {blanks.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          이 난이도의 빈칸 문제가 없습니다.
        </p>
      ) : (
        <>
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-wrap gap-1.5 leading-8">
                {words.map((word, idx) => {
                  if (blankIndices.has(idx)) {
                    const result = results?.[idx];
                    return (
                      <span key={idx} className="inline-flex items-center gap-1">
                        <Input
                          className={`w-24 h-8 text-sm text-center inline-block ${
                            result === true ? 'border-green-500 bg-green-50' :
                            result === false ? 'border-red-500 bg-red-50' : ''
                          }`}
                          value={answers[idx] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [idx]: e.target.value })
                          }
                          disabled={results !== null}
                          placeholder="___"
                        />
                        {result === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {result === false && (
                          <span className="text-xs text-red-500">
                            ({blanks.find((b) => b.index === idx)?.answer})
                          </span>
                        )}
                      </span>
                    );
                  }
                  return <span key={idx}>{word}</span>;
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            {results === null ? (
              <Button onClick={handleSubmit} className="flex-1">
                제출하기
              </Button>
            ) : (
              <Button onClick={handleReset} variant="outline" className="flex-1">
                다시 풀기
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
