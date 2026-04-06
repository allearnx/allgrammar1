'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FirstLetterSentence {
  original: string;
  korean: string;
  speaker?: string;
}

export interface WrongFirstLetter {
  type: 'first_letter';
  koreanText: string;
  userAnswer: string;
  correctAnswer: string;
}

interface FirstLetterExerciseProps {
  sentences: FirstLetterSentence[];
  onComplete: (score: number, wrongAnswers: WrongFirstLetter[]) => void;
}

/** "Hello" → "H____", "I'm" → "I__" */
function makeHint(word: string): string {
  // Keep punctuation-only tokens as-is (e.g. "—", "...")
  const letters = word.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) return word;
  if (letters.length === 1) return word;

  // Keep first letter, replace remaining letters with underscores, keep trailing punctuation
  const firstLetter = word[0];
  let hint = firstLetter;
  for (let i = 1; i < word.length; i++) {
    if (/[a-zA-Z]/.test(word[i])) {
      hint += '_';
    } else {
      hint += word[i];
    }
  }
  return hint;
}

function buildHintString(original: string): string {
  return original.split(/\s+/).map(makeHint).join(' ');
}

/** Normalize for comparison: lowercase, strip punctuation except apostrophes */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compareWords(userAnswer: string, correctAnswer: string): boolean {
  return normalize(userAnswer) === normalize(correctAnswer);
}

export function FirstLetterExercise({ sentences, onComplete }: FirstLetterExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const wrongsRef = useRef<WrongFirstLetter[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const sentence = sentences[currentIndex];

  useEffect(() => {
    if (!showResult) {
      // Small delay so the DOM settles after re-render
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, showResult]);

  if (sentences.length === 0) {
    return <p className="text-center text-muted-foreground py-4">대화문이 없습니다.</p>;
  }

  if (!sentence) return null;

  const hint = buildHintString(sentence.original);

  function handleCheck() {
    if (!userInput.trim()) return;
    const correct = compareWords(userInput, sentence.original);
    setIsCorrect(correct);
    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
    if (!correct) {
      wrongsRef.current.push({
        type: 'first_letter',
        koreanText: sentence.korean,
        userAnswer: userInput,
        correctAnswer: sentence.original,
      });
    }
  }

  function handleNext() {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setShowResult(false);
      setIsCorrect(false);
    } else {
      const finalScore = Math.round((score.correct / sentences.length) * 100);
      onComplete(finalScore, wrongsRef.current);
      toast.success(`첫 글자 힌트 완료! ${score.correct}/${sentences.length} 정답`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (!showResult) {
        handleCheck();
      } else {
        handleNext();
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {sentences.length}
        </span>
        {score.total > 0 && (
          <Badge variant="secondary">{score.correct}/{score.total} 정답</Badge>
        )}
      </div>

      {/* Korean meaning */}
      <Card>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">한국어 뜻</p>
          <p className="text-base font-medium">
            {sentence.speaker && (
              <Badge variant="outline" className="mr-1.5 text-[10px] px-1 py-0 align-middle">
                {sentence.speaker}
              </Badge>
            )}
            {sentence.korean}
          </p>
        </CardContent>
      </Card>

      {/* First letter hint */}
      <Card>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">첫 글자 힌트</p>
          <p className="text-lg font-mono tracking-wider break-all">{hint}</p>
        </CardContent>
      </Card>

      {/* Input */}
      <div className="space-y-2">
        <Input
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="문장을 입력하세요"
          disabled={showResult}
          className={cn(
            'text-base',
            showResult && isCorrect && 'border-green-400 bg-green-50 dark:bg-green-950/20',
            showResult && !isCorrect && 'border-red-400 bg-red-50 dark:bg-red-950/20'
          )}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Result */}
      {showResult && (
        <div className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2.5',
          isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
        )}>
          {isCorrect ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">정답!</span>
            </>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">오답</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 pl-6">
                정답: {sentence.original}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action button */}
      {!showResult ? (
        <Button onClick={handleCheck} className="w-full" disabled={!userInput.trim()}>
          확인
        </Button>
      ) : (
        <Button onClick={handleNext} className="w-full">
          {currentIndex < sentences.length - 1 ? '다음 문장' : '완료'}
        </Button>
      )}
    </div>
  );
}
