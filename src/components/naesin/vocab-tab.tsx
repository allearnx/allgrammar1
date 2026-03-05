'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle, Copy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { vocabToMemoryItem } from '@/lib/naesin/adapters';
import { ScoreBadges, ResultCard, CompletionView, NextButton } from '@/components/memory/shared';
import { QuizSetSelector } from './quiz-set-selector';
import type { MemoryItem, StudentMemoryProgress, NaesinVocabulary, NaesinVocabQuizResult, NaesinVocabQuizSet } from '@/types/database';

type FlashcardItem = MemoryItem & { progress: StudentMemoryProgress | null };


interface VocabTabProps {
  vocabulary: NaesinVocabulary[];
  unitId: string;
  onStageComplete: () => void;
  quizSets?: NaesinVocabQuizSet[];
  completedSetIds?: string[];
}

export function VocabTab({ vocabulary, unitId, onStageComplete, quizSets, completedSetIds }: VocabTabProps) {
  const [activeTab, setActiveTab] = useState('flashcard');
  const hasQuizSets = quizSets && quizSets.length > 0;

  const completedSet = useMemo(
    () => new Set(completedSetIds || []),
    [completedSetIds]
  );

  // Find first uncompleted set or default to first
  const firstUncompletedSet = hasQuizSets
    ? quizSets.find((s) => !completedSet.has(s.id))?.id || quizSets[0].id
    : null;
  const [activeSetId, setActiveSetId] = useState<string | null>(firstUncompletedSet);

  // Filter vocabulary by active quiz set
  const filteredVocabulary = useMemo(() => {
    if (!hasQuizSets || !activeSetId) return vocabulary;
    const activeSet = quizSets.find((s) => s.id === activeSetId);
    if (!activeSet) return vocabulary;
    const vocabIdSet = new Set(activeSet.vocab_ids);
    return vocabulary.filter((v) => vocabIdSet.has(v.id));
  }, [hasQuizSets, activeSetId, quizSets, vocabulary]);

  const items = filteredVocabulary.map(vocabToMemoryItem);
  const hasEnoughForQuiz = filteredVocabulary.length >= 4;
  const spellingItems = items.filter((i) => i.spelling_answer);

  async function saveVocabProgress(type: 'flashcard' | 'quiz' | 'spelling', score?: number) {
    try {
      const res = await fetch('/api/naesin/vocab/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type, score, totalItems: filteredVocabulary.length }),
      });
      const data = await res.json();
      if (data.vocabCompleted) {
        toast.success('단어 암기 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch {
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  async function saveQuizSetResult(score: number, wrongWords: { front_text: string; back_text: string }[]) {
    if (!activeSetId) return;
    try {
      await fetch('/api/naesin/vocab/quiz-set-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizSetId: activeSetId, unitId, score, wrongWords }),
      });
    } catch {
      // Silent fail
    }
  }

  if (vocabulary.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 단어가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {hasQuizSets && (
        <QuizSetSelector
          quizSets={quizSets}
          completedSetIds={completedSet}
          activeSetId={activeSetId}
          onSelect={setActiveSetId}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flashcard">플래시카드</TabsTrigger>
          <TabsTrigger value="quiz" disabled={!hasEnoughForQuiz}>
            퀴즈
          </TabsTrigger>
          <TabsTrigger value="spelling" disabled={spellingItems.length === 0}>
            스펠링
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcard" className="mt-4">
          <NaesinFlashcardView
            key={activeSetId || 'all'}
            items={items}
            vocabulary={filteredVocabulary}
            onComplete={() => saveVocabProgress('flashcard')}
          />
        </TabsContent>

        <TabsContent value="quiz" className="mt-4">
          <NaesinQuizView
            key={activeSetId || 'all'}
            vocabulary={filteredVocabulary}
            allVocabulary={vocabulary}
            unitId={unitId}
            onComplete={(score) => saveVocabProgress('quiz', score)}
            onQuizSetResult={hasQuizSets ? saveQuizSetResult : undefined}
          />
        </TabsContent>

        <TabsContent value="spelling" className="mt-4">
          <NaesinSpellingView
            key={activeSetId || 'all'}
            items={spellingItems}
            vocabulary={filteredVocabulary}
            onComplete={(score) => saveVocabProgress('spelling', score)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NaesinFlashcardView({ items, vocabulary, onComplete }: { items: FlashcardItem[]; vocabulary: NaesinVocabulary[]; onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seenAll, setSeenAll] = useState(false);

  const item = items[currentIndex];
  const vocab = vocabulary[currentIndex];

  function handleFlip() {
    setFlipped(!flipped);
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    } else if (!seenAll) {
      setSeenAll(true);
      onComplete();
      toast.success('모든 카드를 확인했습니다!');
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setFlipped(false);
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} / {items.length}
      </div>

      <div
        className="cursor-pointer max-w-md mx-auto"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          <Card
            className="absolute inset-0 flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="text-center py-12 px-6">
              <p className="text-3xl font-medium">{item.front_text}</p>
              <p className="text-sm text-muted-foreground mt-4">탭하여 뒤집기</p>
            </CardContent>
          </Card>

          <Card
            className="absolute inset-0 flex items-center justify-center bg-primary/5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardContent className="text-center py-8 px-6">
              {vocab?.part_of_speech && (
                <p className="text-sm text-muted-foreground mb-1">{vocab.part_of_speech}</p>
              )}
              <p className="text-3xl font-medium">{item.back_text}</p>
              {(vocab?.synonyms || vocab?.antonyms) && (
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-base">
                  {vocab.synonyms && (
                    <span className="text-blue-600">= {vocab.synonyms}</span>
                  )}
                  {vocab.antonyms && (
                    <span className="text-red-500">&harr; {vocab.antonyms}</span>
                  )}
                </div>
              )}
              {vocab?.example_sentence && (
                <p className="text-base text-muted-foreground mt-4 italic">
                  &ldquo;{vocab.example_sentence}&rdquo;
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === items.length - 1 && seenAll}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface QuizQuestion {
  front_text: string;
  correctAnswer: string;
  options: string[];
  correctIndex: number;
}

function generateQuizQuestions(vocabulary: NaesinVocabulary[], allVocabulary?: NaesinVocabulary[], targetVocab?: NaesinVocabulary[]): QuizQuestion[] {
  const quizWords = targetVocab || vocabulary;
  const optionPool = allVocabulary || vocabulary;
  return quizWords.map((vocab) => {
    const others = optionPool
      .filter((v) => v.id !== vocab.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
      .map((v) => v.back_text);
    const options = [...others, vocab.back_text].sort(() => Math.random() - 0.5);
    return {
      front_text: vocab.front_text,
      correctAnswer: vocab.back_text,
      options,
      correctIndex: options.indexOf(vocab.back_text),
    };
  });
}

interface WrongWord {
  front_text: string;
  back_text: string;
}

function NaesinQuizView({
  vocabulary,
  allVocabulary,
  unitId,
  onComplete,
  onQuizSetResult,
}: {
  vocabulary: NaesinVocabulary[];
  allVocabulary?: NaesinVocabulary[];
  unitId: string;
  onComplete: (score: number) => void;
  onQuizSetResult?: (score: number, wrongWords: WrongWord[]) => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateQuizQuestions(vocabulary, allVocabulary));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [savedResult, setSavedResult] = useState<NaesinVocabQuizResult | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [saving, setSaving] = useState(false);

  const question = questions[currentIndex];

  function handleSelect(optionIndex: number) {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    const correct = optionIndex === question.correctIndex;
    setShowResult(true);
    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
      setWrongWords((prev) => [...prev, { front_text: question.front_text, back_text: question.correctAnswer }]);
    }
    if (currentIndex === questions.length - 1) {
      const finalCorrect = correct ? score.correct + 1 : score.correct;
      const pct = Math.round((finalCorrect / questions.length) * 100);
      onComplete(pct);
      const finalWrong = correct
        ? wrongWords
        : [...wrongWords, { front_text: question.front_text, back_text: question.correctAnswer }];
      saveQuizResult(finalCorrect, pct, finalWrong);
      onQuizSetResult?.(pct, finalWrong);
    }
  }

  async function saveQuizResult(correctCount: number, pct: number, finalWrongWords: WrongWord[]) {
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/vocab/quiz-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          score: pct,
          totalQuestions: questions.length,
          correctCount,
          wrongWords: finalWrongWords,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setSavedResult(data.result);
        setAttemptNumber(data.result.attempt_number);
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
      setQuizFinished(true);
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setSelectedAnswer(null);
    }
  }

  function handleRetryAll() {
    setQuestions(generateQuizQuestions(vocabulary, allVocabulary));
    setCurrentIndex(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setScore({ correct: 0, wrong: 0 });
    setWrongWords([]);
    setQuizFinished(false);
    setSavedResult(null);
  }

  function handleRetryWrong() {
    if (wrongWords.length === 0) return;
    const wrongFrontTexts = new Set(wrongWords.map(w => w.front_text));
    const wrongVocab = vocabulary.filter(v => wrongFrontTexts.has(v.front_text));
    if (wrongVocab.length < 2) {
      handleRetryAll();
      return;
    }
    const pool = allVocabulary || vocabulary;
    setQuestions(generateQuizQuestions(wrongVocab.length >= 5 ? wrongVocab : pool, pool, wrongVocab));
    setCurrentIndex(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setScore({ correct: 0, wrong: 0 });
    setWrongWords([]);
    setQuizFinished(false);
    setSavedResult(null);
  }

  function handleCopyLink() {
    if (!savedResult) return;
    const url = `${window.location.origin}/student/naesin/quiz-result/${savedResult.id}`;
    navigator.clipboard.writeText(url);
    toast.success('결과 링크가 복사되었습니다');
  }

  if (!question && !quizFinished) return null;

  if (quizFinished) {
    const pct = Math.round((score.correct / questions.length) * 100);
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{attemptNumber}회차 결과</p>
          <p className={cn(
            'text-6xl font-bold',
            pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {pct}점
          </p>
          <p className="text-muted-foreground">
            {questions.length}문제 중 {score.correct}개 정답
          </p>
        </div>

        {wrongWords.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <p className="font-medium text-red-600 mb-3">틀린 단어 ({wrongWords.length}개)</p>
              <div className="space-y-2">
                {wrongWords.map((w, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                    <span className="font-medium">{w.front_text}</span>
                    <span className="text-muted-foreground">{w.back_text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-2">
          {wrongWords.length > 0 && (
            <Button onClick={handleRetryWrong} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              {attemptNumber + 1}회차 다시 풀기 (틀린 단어)
            </Button>
          )}
          <Button variant="outline" onClick={handleRetryAll} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            전체 다시 풀기
          </Button>
          {savedResult && (
            <Button variant="ghost" size="sm" onClick={handleCopyLink} className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              결과 링크 복사
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
        <ScoreBadges correct={score.correct} wrong={score.wrong} />
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-2xl font-medium">{question.front_text}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 max-w-md mx-auto">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrectOption = idx === question.correctIndex;
          return (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                'h-auto py-3 px-4 text-left justify-start whitespace-normal',
                showResult && isCorrectOption && 'border-green-500 bg-green-50 text-green-700',
                showResult && isSelected && !isCorrectOption && 'border-red-500 bg-red-50 text-red-700'
              )}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
            >
              <span className="mr-3 shrink-0 font-medium">{String.fromCharCode(65 + idx)}.</span>
              {option}
              {showResult && isCorrectOption && <CheckCircle className="h-4 w-4 ml-auto shrink-0 text-green-500" />}
              {showResult && isSelected && !isCorrectOption && <XCircle className="h-4 w-4 ml-auto shrink-0 text-red-500" />}
            </Button>
          );
        })}
      </div>

      {showResult && !quizFinished && (
        <div className="text-center">
          {currentIndex < questions.length - 1 ? (
            <NextButton onClick={handleNext} />
          ) : (
            saving && <p className="text-sm text-muted-foreground">결과 저장 중...</p>
          )}
        </div>
      )}
    </div>
  );
}

function NaesinSpellingView({ items, vocabulary, onComplete }: { items: FlashcardItem[]; vocabulary: NaesinVocabulary[]; onComplete: (score: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const item = items[currentIndex];
  const vocab = vocabulary.find((v) => v.id === item?.id);
  const isFinished = currentIndex === items.length - 1 && showResult;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || showResult) return;
    const correct = answer.trim().toLowerCase() === item.spelling_answer?.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    }
    if (currentIndex === items.length - 1) {
      const finalCorrect = correct ? score.correct + 1 : score.correct;
      const pct = Math.round((finalCorrect / items.length) * 100);
      onComplete(pct);
    }
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setIsCorrect(false);
      setAnswer('');
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setShowResult(false);
    setIsCorrect(false);
    setAnswer('');
    setScore({ correct: 0, wrong: 0 });
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {items.length}</span>
        <ScoreBadges correct={score.correct} wrong={score.wrong} />
      </div>

      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">힌트</p>
          <p className="text-lg font-medium">{item.spelling_hint || item.back_text}</p>
          {vocab?.example_sentence && (
            <p className="text-sm text-muted-foreground mt-3 italic">
              &ldquo;{vocab.example_sentence.replace(
                new RegExp(item.spelling_answer || item.front_text, 'gi'),
                '______'
              )}&rdquo;
            </p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="영어 스펠링을 입력하세요"
          disabled={showResult}
          autoFocus
          className="text-center text-lg"
        />
        {!showResult && (
          <Button type="submit" className="w-full" disabled={!answer.trim()}>
            확인
          </Button>
        )}
      </form>

      {showResult && (
        <div className="space-y-4">
          <ResultCard isCorrect={isCorrect} correctAnswer={item.spelling_answer || undefined} />
          <div className="text-center">
            {isFinished ? (
              <CompletionView label="스펠링 테스트" correct={score.correct} total={items.length} onReset={handleReset} />
            ) : (
              <NextButton onClick={handleNext} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
