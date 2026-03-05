'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, GripVertical, Shuffle, Send, Loader2, AlertTriangle } from 'lucide-react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { toast } from 'sonner';
import { passageToTextbookPassage } from '@/lib/naesin/adapters';
import type { NaesinPassage, TextbookPassage, BlankItem, SentenceItem } from '@/types/database';

interface PassageTabProps {
  passages: NaesinPassage[];
  unitId: string;
  onStageComplete: () => void;
}

export function PassageTab({ passages, unitId, onStageComplete }: PassageTabProps) {
  const [activeTab, setActiveTab] = useState('fill-blanks');
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);

  if (passages.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 교과서 지문이 없습니다.
      </p>
    );
  }

  const passage = passages[currentPassageIndex];
  const textbookPassage = passageToTextbookPassage(passage);
  const hasBlanks =
    (Array.isArray(passage.blanks_easy) && passage.blanks_easy.length > 0) ||
    (Array.isArray(passage.blanks_medium) && passage.blanks_medium.length > 0) ||
    (Array.isArray(passage.blanks_hard) && passage.blanks_hard.length > 0);
  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;

  async function savePassageProgress(type: 'fill_blanks' | 'ordering' | 'translation', score: number, wrongAnswers?: unknown[]) {
    try {
      const res = await fetch('/api/naesin/passage/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type, score, wrongAnswers }),
      });
      const data = await res.json();
      if (data.passageCompleted) {
        toast.success('교과서 암기 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch {
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  async function saveWrongAnswers(wrongItems: unknown[]) {
    if (wrongItems.length === 0) return;
    try {
      await fetch('/api/naesin/wrong-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          stage: 'passage',
          sourceType: activeTab,
          wrongAnswers: wrongItems,
        }),
      });
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="space-y-4">
      {passages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {passages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setCurrentPassageIndex(idx)}
              className={`shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                idx === currentPassageIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fill-blanks" disabled={!hasBlanks}>
            빈칸 채우기
          </TabsTrigger>
          <TabsTrigger value="ordering" disabled={!hasSentences}>
            순서 배열
          </TabsTrigger>
          <TabsTrigger value="translation">
            영작
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fill-blanks" className="mt-4">
          <NaesinFillBlanksView
            key={passage.id}
            passage={textbookPassage}
            onScoreChange={(score, wrongs) => {
              savePassageProgress('fill_blanks', score);
              if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
            }}
          />
        </TabsContent>

        <TabsContent value="ordering" className="mt-4">
          <NaesinOrderingView
            key={passage.id}
            passage={textbookPassage}
            onScoreChange={(score) => savePassageProgress('ordering', score)}
          />
        </TabsContent>

        <TabsContent value="translation" className="mt-4">
          <NaesinTranslationView
            key={passage.id}
            passage={textbookPassage}
            onScoreChange={(score, wrongs) => {
              savePassageProgress('translation', score);
              if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// Fill Blanks
// ============================================

type Difficulty = 'easy' | 'medium' | 'hard';

function NaesinFillBlanksView({
  passage,
  onScoreChange,
}: {
  passage: TextbookPassage;
  onScoreChange: (score: number, wrongAnswers?: unknown[]) => void;
}) {
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
    const wrongs: unknown[] = [];
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
    onScoreChange(score, wrongs);
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

          {results !== null && Object.values(results).some((v) => !v) && (
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

// ============================================
// Ordering (Drag & Drop)
// ============================================

function SortableWord({ id, word, index }: { id: string; word: string; index: number }) {
  const { ref, isDragging } = useSortable({ id, index, group: 'naesin-words' });
  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'shadow-lg opacity-70' : ''
      }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm">{word}</span>
    </div>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function NaesinOrderingView({ passage, onScoreChange }: { passage: TextbookPassage; onScoreChange: (score: number) => void }) {
  const sentences = (passage.sentences || []) as SentenceItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const sentence = sentences[currentIndex];
  const [items, setItems] = useState<string[]>(() =>
    sentence ? shuffleArray(sentence.words) : []
  );

  const handleDragOver = useCallback(
    (event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragOver']>>[0]) => {
      setItems((currentItems) => move(currentItems, event));
    },
    []
  );

  function handleCheck() {
    if (!sentence) return;
    const originalWords = sentence.original.split(/\s+/);
    const correct = items.join(' ') === originalWords.join(' ');
    setIsCorrect(correct);
    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  }

  function handleNext() {
    if (currentIndex < sentences.length - 1) {
      const nextSentence = sentences[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setItems(shuffleArray(nextSentence.words));
      setShowResult(false);
      setIsCorrect(false);
    } else {
      const finalScore = Math.round((score.correct / sentences.length) * 100);
      onScoreChange(finalScore);
      toast.success(`순서 배열 완료! ${score.correct}/${sentences.length} 정답`);
    }
  }

  function handleShuffle() {
    if (sentence) setItems(shuffleArray(sentence.words));
  }

  if (sentences.length === 0) {
    return <p className="text-center text-muted-foreground py-4">순서 배열 문제가 없습니다.</p>;
  }

  if (!sentence) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {sentences.length}</span>
        <Badge variant="secondary">{score.correct}/{score.total} 정답</Badge>
      </div>

      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">한국어 뜻</p>
          <p className="text-lg font-medium">{sentence.korean}</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">단어를 올바른 순서로 배열하세요:</p>
          <Button variant="ghost" size="sm" onClick={handleShuffle} disabled={showResult}>
            <Shuffle className="h-4 w-4 mr-1" />
            섞기
          </Button>
        </div>
        <DragDropProvider onDragOver={handleDragOver}>
          <div className="flex flex-col gap-2">
            {items.map((word, index) => (
              <SortableWord key={`${word}-${index}`} id={`${word}-${index}`} word={word} index={index} />
            ))}
          </div>
        </DragDropProvider>
      </div>

      {showResult && (
        <Card className={isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <CardContent className="py-4 text-center">
            {isCorrect ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">정답!</span>
              </div>
            ) : (
              <div className="text-red-700">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">오답</span>
                </div>
                <p className="text-sm">정답: {sentence.original}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {!showResult ? (
          <Button onClick={handleCheck} className="flex-1">확인</Button>
        ) : (
          <Button onClick={handleNext} className="flex-1">
            {currentIndex < sentences.length - 1 ? '다음 문장' : '완료'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Translation (영작)
// ============================================

interface TranslationGradingResult {
  score: number;
  feedback: string;
  correctedSentence: string;
}

function NaesinTranslationView({
  passage,
  onScoreChange,
}: {
  passage: TextbookPassage;
  onScoreChange: (score: number, wrongAnswers?: unknown[]) => void;
}) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationGradingResult | null>(null);

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

      const wrongs = data.score < 80
        ? [{ type: 'translation', koreanText: passage.korean_translation, userAnswer: answer.trim(), score: data.score, feedback: data.feedback }]
        : [];
      onScoreChange(data.score, wrongs);
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
          <span className="text-xs text-muted-foreground">AI 채점</span>
          {result !== null ? (
            <Button onClick={handleReset} variant="outline">다시 작성</Button>
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
                <p className="text-sm font-medium mb-1">모범 답안:</p>
                <p className="text-sm whitespace-pre-wrap">{result.correctedSentence}</p>
              </div>
            </CardContent>
          </Card>

          {result.score < 80 && (
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
