'use client';

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
import { getEncouragement } from '@/lib/naesin/encouragement';
import { useFillBlanksState } from '@/hooks/use-fill-blanks-state';
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

export function FillBlanksExercise({ passage, onComplete, showWrongAlert: _showWrongAlert }: FillBlanksExerciseProps) {
  const s = useFillBlanksState({ passage, onComplete });

  function renderWord(idx: number) {
    if (s.blankIndices.has(idx)) {
      if (s.retryMode && s.lockedCorrect[idx] !== undefined) {
        return (
          <span key={idx} className="inline-flex items-center gap-1">
            <span className="px-2 py-0.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded">
              {s.lockedCorrect[idx]}
            </span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </span>
        );
      }

      const result = s.results?.[idx];
      return (
        <span key={idx} className="inline-flex items-center gap-1">
          <Input
            className={`w-24 h-8 text-sm text-center inline-block ${
              result === true ? 'border-green-500 bg-green-50' :
              result === false ? 'border-red-500 bg-red-50' : ''
            }`}
            value={s.answers[idx] || ''}
            onChange={(e) => s.setAnswers({ ...s.answers, [idx]: e.target.value })}
            disabled={s.results !== null}
            placeholder="___"
          />
          {result === true && <CheckCircle className="h-4 w-4 text-green-500" />}
          {result === false && (
            <span className="text-xs text-red-500">
              ({s.blanks.find((b: BlankItem) => b.index === idx)?.answer})
            </span>
          )}
        </span>
      );
    }
    return <span key={idx}>{s.words[idx]}</span>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={s.difficulty} onValueChange={(v) => s.changeDifficulty(v as Difficulty)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="easy" disabled={s.retryMode}>쉬움</TabsTrigger>
          <TabsTrigger value="medium" disabled={!passage.blanks_medium || s.retryMode}>보통</TabsTrigger>
          <TabsTrigger value="hard" disabled={!passage.blanks_hard || s.retryMode}>어려움</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        모든 시도가 점수로 기록되어 리포트에 반영됩니다.
      </div>

      {s.retryMode && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          <ListRestart className="h-3.5 w-3.5 shrink-0" />
          틀린 {s.blanks.length - Object.keys(s.lockedCorrect).length}개 빈칸만 다시 풀어보세요
        </div>
      )}

      {s.blanks.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">이 난이도의 빈칸 문제가 없습니다.</p>
      ) : (
        <>
          {s.sentenceGroups ? (
            <div className="space-y-3">
              {s.sentenceGroups.map((group, gi) => (
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
                    {s.words.map((_, idx) => renderWord(idx))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex gap-2">
            {s.results === null ? (
              <Button onClick={s.handleSubmit} className="flex-1">제출하기</Button>
            ) : (
              <>
                {s.wrongCount > 0 && (
                  <Button onClick={s.handleRetryWrong} className="flex-1">
                    <ListRestart className="h-4 w-4 mr-1" />
                    오답만 다시 풀기
                  </Button>
                )}
                <Button onClick={s.handleReset} variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  전체 다시 풀기
                </Button>
              </>
            )}
          </div>

          {s.resultModal && (
            <FillBlanksResultDialog
              result={s.resultModal}
              wrongCount={s.wrongCount}
              onClose={() => s.setResultModal(null)}
              onRetryWrong={() => { s.setResultModal(null); s.handleRetryWrong(); }}
              onReset={() => { s.setResultModal(null); s.handleReset(); }}
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
                {result.score}점 — {getEncouragement(result.score)}
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
                {result.correct}/{result.total} 정답 — {getEncouragement(result.score)}
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
