'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { TextbookPassage, BlankItem } from '@/types/database';

type Difficulty = 'easy' | 'medium' | 'hard';

interface WrongBlank {
  type: 'fill_blank';
  difficulty: Difficulty;
  blankIndex: number;
  correctAnswer: string;
  userAnswer: string;
}

interface FillBlanksExerciseProps {
  passage: TextbookPassage;
  onComplete: (score: number, wrongAnswers: WrongBlank[]) => void;
  showWrongAlert?: boolean;
}

export function FillBlanksExercise({ passage, onComplete, showWrongAlert }: FillBlanksExerciseProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean> | null>(null);

  const blanksMap: Record<Difficulty, BlankItem[] | null> = {
    easy: passage.blanks_easy as BlankItem[] | null,
    medium: passage.blanks_medium as BlankItem[] | null,
    hard: passage.blanks_hard as BlankItem[] | null,
  };

  const blanks = blanksMap[difficulty] || [];
  const words = passage.original_text.split(/\s+/);
  const blankIndices = new Set(blanks.map((b) => b.index));

  function handleSubmit() {
    if (blanks.length === 0) return;
    const newResults: Record<number, boolean> = {};
    let correctCount = 0;
    const wrongs: WrongBlank[] = [];

    blanks.forEach((blank) => {
      const userAnswer = (answers[blank.index] || '').trim().toLowerCase();
      const isCorrect = userAnswer === blank.answer.toLowerCase();
      newResults[blank.index] = isCorrect;
      if (isCorrect) {
        correctCount++;
      } else {
        wrongs.push({
          type: 'fill_blank',
          difficulty,
          blankIndex: blank.index,
          correctAnswer: blank.answer,
          userAnswer: answers[blank.index] || '',
        });
      }
    });

    setResults(newResults);
    const score = Math.round((correctCount / blanks.length) * 100);
    onComplete(score, wrongs);
    toast(score >= 80 ? '잘했어요!' : '다시 도전해보세요!', {
      description: `${correctCount}/${blanks.length} 정답 (${score}점)`,
    });
  }

  function handleReset() {
    setAnswers({});
    setResults(null);
  }

  return (
    <div className="space-y-4">
      <Tabs value={difficulty} onValueChange={(v) => { setDifficulty(v as Difficulty); handleReset(); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="easy">쉬움</TabsTrigger>
          <TabsTrigger value="medium" disabled={!passage.blanks_medium}>보통</TabsTrigger>
          <TabsTrigger value="hard" disabled={!passage.blanks_hard}>어려움</TabsTrigger>
        </TabsList>
      </Tabs>

      {blanks.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">이 난이도의 빈칸 문제가 없습니다.</p>
      ) : (
        <>
          {passage.korean_translation && (
            <Card className="bg-muted/40">
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground mb-1">한국어 해석</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{passage.korean_translation}</p>
              </CardContent>
            </Card>
          )}

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
                          onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
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

          {showWrongAlert && results !== null && Object.values(results).some((v) => !v) && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              오답이 기록되었습니다. 오답을 써서 선생님에게 제출하세요.
            </div>
          )}

          <div className="flex gap-2">
            {results === null ? (
              <Button onClick={handleSubmit} className="flex-1">제출하기</Button>
            ) : (
              <Button onClick={handleReset} variant="outline" className="flex-1">다시 풀기</Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
