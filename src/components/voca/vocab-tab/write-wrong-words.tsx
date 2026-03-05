'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface WrongWord {
  word: string;
  match: string;
  type: 'synonym' | 'antonym';
}

interface WriteWrongWordsProps {
  wrongWords: WrongWord[];
  dayId: string;
  onSubmitted: () => void;
}

const REQUIRED_ATTEMPTS = 5;

export function WriteWrongWords({ wrongWords, dayId, onSubmitted }: WriteWrongWordsProps) {
  const [writings, setWritings] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    wrongWords.forEach((w) => {
      init[w.word] = Array(REQUIRED_ATTEMPTS).fill('');
    });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleInput(word: string, idx: number, value: string) {
    setWritings((prev) => {
      const arr = [...prev[word]];
      arr[idx] = value;
      return { ...prev, [word]: arr };
    });
  }

  // Check if a specific attempt is correct
  function isCorrect(word: string, idx: number): boolean | null {
    const val = writings[word][idx].trim().toLowerCase();
    if (!val) return null;
    return val === word.toLowerCase();
  }

  // Check if all fields are correctly filled
  const allComplete = wrongWords.every((w) =>
    writings[w.word].every((val) => val.trim().toLowerCase() === w.word.toLowerCase())
  );

  async function handleSubmit() {
    if (!allComplete) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/voca/matching-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId,
          wrongWords,
          writings: wrongWords.map((w) => ({
            word: w.word,
            attempts: writings[w.word],
          })),
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      toast.success('선생님에게 제출되었습니다!');
      onSubmitted();
    } catch {
      toast.error('제출 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <p className="text-lg font-medium">제출 완료!</p>
        <p className="text-muted-foreground">선생님이 확인하면 알려드립니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <p className="text-lg font-semibold">오답 5번 쓰기</p>
        <p className="text-sm text-muted-foreground">틀린 단어를 각각 5번씩 정확히 입력하세요.</p>
      </div>

      {wrongWords.map((w) => (
        <Card key={w.word}>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-lg">{w.word}</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-muted-foreground">{w.match}</span>
              <Badge variant="outline" className="text-xs">
                {w.type === 'synonym' ? '유의어' : '반의어'}
              </Badge>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {writings[w.word].map((val, idx) => {
                const correct = isCorrect(w.word, idx);
                return (
                  <Input
                    key={idx}
                    value={val}
                    onChange={(e) => handleInput(w.word, idx, e.target.value)}
                    className={`text-center text-sm h-9 ${
                      correct === true
                        ? 'border-green-500 bg-green-50'
                        : correct === false
                        ? 'border-red-500 bg-red-50'
                        : ''
                    }`}
                    placeholder={`${idx + 1}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={!allComplete || submitting}
        className="w-full"
        size="lg"
      >
        <Send className="h-4 w-4 mr-2" />
        {submitting ? '제출 중...' : '제출하기'}
      </Button>
    </div>
  );
}
