'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, Trophy, RotateCcw, PenLine, ListRestart } from 'lucide-react';
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
  onComplete: (score: number, wrongAnswers: WrongBlank[], difficulty: Difficulty) => void;
  showWrongAlert?: boolean;
}

interface SentenceRange {
  korean: string;
  startIdx: number;
  endIdx: number;
  wordCount: number;
}

const SHORT_SENTENCE_THRESHOLD = 8;

export function FillBlanksExercise({ passage, onComplete, showWrongAlert: _showWrongAlert }: FillBlanksExerciseProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean> | null>(null);
  const [resultModal, setResultModal] = useState<{ score: number; correct: number; total: number } | null>(null);

  // Retry-wrong-only state
  const [retryMode, setRetryMode] = useState(false);
  const [lockedCorrect, setLockedCorrect] = useState<Record<number, string>>({});
  const [previousCorrectCount, setPreviousCorrectCount] = useState(0);

  const blanksMap: Record<Difficulty, BlankItem[] | null> = {
    easy: passage.blanks_easy as BlankItem[] | null,
    medium: passage.blanks_medium as BlankItem[] | null,
    hard: passage.blanks_hard as BlankItem[] | null,
  };

  const blanks = blanksMap[difficulty] || [];
  const words = passage.original_text.split(/\s+/);
  const blankIndices = new Set(blanks.map((b) => b.index));

  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;

  // Count how many wrongs exist (for button visibility)
  const wrongCount = results ? Object.values(results).filter((v) => !v).length : 0;

  // Build sentence ranges and group short ones into pairs
  const sentenceGroups = useMemo(() => {
    if (!hasSentences) return null;

    const ranges: SentenceRange[] = [];
    let offset = 0;
    for (const s of passage.sentences!) {
      const wc = s.original.split(/\s+/).filter(Boolean).length;
      ranges.push({ korean: s.korean, startIdx: offset, endIdx: offset + wc - 1, wordCount: wc });
      offset += wc;
    }

    const groups: SentenceRange[][] = [];
    let i = 0;
    while (i < ranges.length) {
      const cur = ranges[i];
      if (cur.wordCount < SHORT_SENTENCE_THRESHOLD && i + 1 < ranges.length) {
        const next = ranges[i + 1];
        if (next.wordCount < SHORT_SENTENCE_THRESHOLD) {
          groups.push([cur, next]);
          i += 2;
          continue;
        }
      }
      groups.push([cur]);
      i++;
    }
    return groups;
  }, [hasSentences, passage.sentences]);

  function renderWord(idx: number) {
    if (blankIndices.has(idx)) {
      // In retry mode, locked blanks show as green text (no input)
      if (retryMode && lockedCorrect[idx] !== undefined) {
        return (
          <span key={idx} className="inline-flex items-center gap-1">
            <span className="px-2 py-0.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded">
              {lockedCorrect[idx]}
            </span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </span>
        );
      }

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
    return <span key={idx}>{words[idx]}</span>;
  }

  function handleSubmit() {
    if (blanks.length === 0) return;
    const newResults: Record<number, boolean> = {};
    let correctCount = 0;
    const wrongs: WrongBlank[] = [];

    blanks.forEach((blank) => {
      // In retry mode, skip locked blanks
      if (retryMode && lockedCorrect[blank.index] !== undefined) {
        newResults[blank.index] = true;
        correctCount++;
        return;
      }

      const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:'"()]/g, '');
      const userAnswer = normalize(answers[blank.index] || '');
      const isCorrect = userAnswer === normalize(blank.answer);
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

    // In retry mode, combine previous correct + new correct
    const totalCorrect = retryMode ? previousCorrectCount + (correctCount - Object.keys(lockedCorrect).length) : correctCount;
    const score = Math.round((totalCorrect / blanks.length) * 100);
    onComplete(score, wrongs, difficulty);
    setResultModal({ score, correct: totalCorrect, total: blanks.length });
  }

  function handleRetryWrong() {
    if (!results) return;

    // Count correct answers from current results (including previously locked ones)
    const correctIndices: Record<number, string> = { ...lockedCorrect };
    let totalCorrectSoFar = previousCorrectCount;

    blanks.forEach((blank) => {
      if (results[blank.index] === true && lockedCorrect[blank.index] === undefined) {
        correctIndices[blank.index] = answers[blank.index] || blank.answer;
        totalCorrectSoFar++;
      }
    });

    // Clear wrong answers, keep correct locked
    const newAnswers: Record<number, string> = {};
    blanks.forEach((blank) => {
      if (correctIndices[blank.index] !== undefined) {
        newAnswers[blank.index] = correctIndices[blank.index];
      }
    });

    setLockedCorrect(correctIndices);
    setPreviousCorrectCount(totalCorrectSoFar);
    setAnswers(newAnswers);
    setResults(null);
    setResultModal(null);
    setRetryMode(true);
  }

  function handleReset() {
    setAnswers({});
    setResults(null);
    setResultModal(null);
    setRetryMode(false);
    setLockedCorrect({});
    setPreviousCorrectCount(0);
  }

  return (
    <div className="space-y-4">
      <Tabs value={difficulty} onValueChange={(v) => { setDifficulty(v as Difficulty); handleReset(); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="easy" disabled={retryMode}>쉬움</TabsTrigger>
          <TabsTrigger value="medium" disabled={!passage.blanks_medium || retryMode}>보통</TabsTrigger>
          <TabsTrigger value="hard" disabled={!passage.blanks_hard || retryMode}>어려움</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        모든 시도가 점수로 기록되어 리포트에 반영됩니다. 80점 이상이면 다음 단계로 넘어갈 수 있어요!
      </div>

      {retryMode && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          <ListRestart className="h-3.5 w-3.5 shrink-0" />
          틀린 {blanks.length - Object.keys(lockedCorrect).length}개 빈칸만 다시 풀어보세요
        </div>
      )}

      {blanks.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">이 난이도의 빈칸 문제가 없습니다.</p>
      ) : (
        <>
          {sentenceGroups ? (
            <div className="space-y-3">
              {sentenceGroups.map((group, gi) => (
                <Card key={gi}>
                  <CardContent className="py-4 space-y-4">
                    {group.map((sentence, si) => (
                      <div key={si} className={si > 0 ? 'pt-4 border-t border-border/50' : ''}>
                        <p className="text-sm text-muted-foreground mb-2">{sentence.korean}</p>
                        <div className="flex flex-wrap gap-1.5 leading-8">
                          {Array.from({ length: sentence.endIdx - sentence.startIdx + 1 }, (_, wi) =>
                            renderWord(sentence.startIdx + wi)
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    {words.map((_, idx) => renderWord(idx))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex gap-2">
            {results === null ? (
              <Button onClick={handleSubmit} className="flex-1">제출하기</Button>
            ) : (
              <>
                {wrongCount > 0 && (
                  <Button onClick={handleRetryWrong} className="flex-1">
                    <ListRestart className="h-4 w-4 mr-1" />
                    오답만 다시 풀기
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  전체 다시 풀기
                </Button>
              </>
            )}
          </div>

          {/* 채점 결과 팝업 */}
          {resultModal && (
            <FillBlanksResultDialog
              result={resultModal}
              wrongCount={wrongCount}
              onClose={() => setResultModal(null)}
              onRetryWrong={() => { setResultModal(null); handleRetryWrong(); }}
              onReset={() => { setResultModal(null); handleReset(); }}
            />
          )}
        </>
      )}
    </div>
  );
}

function FillBlanksResultDialog({
  result,
  wrongCount,
  onClose,
  onRetryWrong,
  onReset,
}: {
  result: { score: number; correct: number; total: number };
  wrongCount: number;
  onClose: () => void;
  onRetryWrong: () => void;
  onReset: () => void;
}) {
  const passed = result.score >= 80;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        {passed ? (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-lg">
                {result.score}점 — 통과!
              </DialogTitle>
              <DialogDescription className="text-center">
                {result.correct}/{result.total} 정답! 잘했어!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {wrongCount > 0 && (
                <Button onClick={onRetryWrong} variant="outline" className="w-full">
                  <ListRestart className="h-4 w-4 mr-1" />
                  오답만 다시 풀기
                </Button>
              )}
              <Button onClick={onClose} className="w-full">확인</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <PenLine className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-lg">
                {result.score}점
              </DialogTitle>
              <DialogDescription className="text-center leading-relaxed">
                {result.correct}/{result.total} 정답
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="rounded-lg bg-orange-50 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-orange-800">
                    틀린 단어를 <span className="font-bold">오답 노트에 써서 선생님에게 제출</span>하고 다시 외워서 도전하자!
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-orange-800">
                    <span className="font-bold">80점 이상</span>을 받아야 다음 단계로 넘어갈 수 있어!
                  </p>
                </div>
              </div>
              {wrongCount > 0 && (
                <Button onClick={onRetryWrong} className="w-full">
                  <ListRestart className="h-4 w-4 mr-1" />
                  오답만 다시 풀기
                </Button>
              )}
              <Button onClick={onReset} className="w-full" variant="outline">
                <RotateCcw className="h-4 w-4 mr-1" />
                전체 다시 풀기
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
