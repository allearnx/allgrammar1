'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { vocabToMemoryItem } from '@/lib/naesin/adapters';
import { ScoreBadges, ResultCard, CompletionView, NextButton } from '@/components/memory/shared';
import type { MemoryItem, StudentMemoryProgress, NaesinVocabulary } from '@/types/database';

type FlashcardItem = MemoryItem & { progress: StudentMemoryProgress | null };


interface VocabTabProps {
  vocabulary: NaesinVocabulary[];
  unitId: string;
  onStageComplete: () => void;
}

export function VocabTab({ vocabulary, unitId, onStageComplete }: VocabTabProps) {
  const [activeTab, setActiveTab] = useState('flashcard');
  const items = vocabulary.map(vocabToMemoryItem);

  const hasEnoughForQuiz = vocabulary.length >= 4;
  const spellingItems = items.filter((i) => i.spelling_answer);

  async function saveVocabProgress(type: 'flashcard' | 'quiz' | 'spelling', score?: number) {
    try {
      const res = await fetch('/api/naesin/vocab/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type, score, totalItems: vocabulary.length }),
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

  if (vocabulary.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 단어가 없습니다.
      </p>
    );
  }

  return (
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
        <NaesinFlashcardView items={items} vocabulary={vocabulary} onComplete={() => saveVocabProgress('flashcard')} />
      </TabsContent>

      <TabsContent value="quiz" className="mt-4">
        <NaesinQuizView vocabulary={vocabulary} onComplete={(score) => saveVocabProgress('quiz', score)} />
      </TabsContent>

      <TabsContent value="spelling" className="mt-4">
        <NaesinSpellingView items={spellingItems} vocabulary={vocabulary} onComplete={(score) => saveVocabProgress('spelling', score)} />
      </TabsContent>
    </Tabs>
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
        className="cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '200px',
          }}
        >
          <Card
            className="absolute inset-0 flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="text-center py-12 px-6">
              <p className="text-xl font-medium">{item.front_text}</p>
              <p className="text-sm text-muted-foreground mt-4">탭하여 뒤집기</p>
            </CardContent>
          </Card>

          <Card
            className="absolute inset-0 flex items-center justify-center bg-primary/5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardContent className="text-center py-8 px-6">
              <p className="text-xl font-medium">{item.back_text}</p>
              {(vocab?.synonyms || vocab?.antonyms) && (
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
                  {vocab.synonyms && (
                    <span className="text-blue-600">= {vocab.synonyms}</span>
                  )}
                  {vocab.antonyms && (
                    <span className="text-red-500">&harr; {vocab.antonyms}</span>
                  )}
                </div>
              )}
              {vocab?.example_sentence && (
                <p className="text-sm text-muted-foreground mt-3 italic">
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

function generateQuizQuestions(vocabulary: NaesinVocabulary[]): QuizQuestion[] {
  return vocabulary.map((vocab) => {
    const others = vocabulary
      .filter((v) => v.id !== vocab.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
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

function NaesinQuizView({ vocabulary, onComplete }: { vocabulary: NaesinVocabulary[]; onComplete: (score: number) => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateQuizQuestions(vocabulary));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const question = questions[currentIndex];
  const isFinished = currentIndex === questions.length - 1 && showResult;

  function handleSelect(optionIndex: number) {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    const correct = optionIndex === question.correctIndex;
    setShowResult(true);
    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    }
    if (currentIndex === questions.length - 1) {
      const finalCorrect = correct ? score.correct + 1 : score.correct;
      const pct = Math.round((finalCorrect / questions.length) * 100);
      onComplete(pct);
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setSelectedAnswer(null);
    }
  }

  function handleReset() {
    setQuestions(generateQuizQuestions(vocabulary));
    setCurrentIndex(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setScore({ correct: 0, wrong: 0 });
  }

  if (!question) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
        <ScoreBadges correct={score.correct} wrong={score.wrong} />
      </div>

      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-lg font-medium">{question.front_text}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3">
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

      {showResult && (
        <div className="text-center">
          {isFinished ? (
            <CompletionView label="퀴즈" correct={score.correct} total={questions.length} onReset={handleReset} />
          ) : (
            <NextButton onClick={handleNext} />
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
  // Find matching vocabulary item for example_sentence
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
