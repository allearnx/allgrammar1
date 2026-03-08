'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, RotateCcw, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MCQOptionList } from '@/components/shared/mcq-option-list';
import { toast } from 'sonner';
import { ScoreBadges, NextButton } from '@/components/memory/shared';
import type { NaesinVocabulary, NaesinVocabQuizResult } from '@/types/database';

interface QuizQuestion {
  front_text: string;
  correctAnswer: string;
  options: string[];
  correctIndex: number;
}

interface WrongWord {
  front_text: string;
  back_text: string;
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

export function NaesinQuizView({
  vocabulary,
  allVocabulary,
  unitId,
  onComplete,
  onQuizSetResult,
  onGoToSpelling,
}: {
  vocabulary: NaesinVocabulary[];
  allVocabulary?: NaesinVocabulary[];
  unitId: string;
  onComplete: (score: number) => void;
  onQuizSetResult?: (score: number, wrongWords: WrongWord[]) => void;
  onGoToSpelling?: () => void;
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
    } catch (err) {
      console.error(err);
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
    const passed = pct >= 80;

    return (
      <div className="space-y-6 max-w-md mx-auto">
        {/* Result CTA Banner */}
        <Card className={cn(
          'border',
          passed
            ? 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
            : 'border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800'
        )}>
          <CardContent className="py-4 text-center space-y-2">
            {passed ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <p className="font-medium text-green-800 dark:text-green-200">
                  퀴즈 통과!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {onGoToSpelling ? '이제 스펠링으로 넘어가자!' : '잘했어요!'}
                </p>
                {onGoToSpelling && (
                  <Button onClick={onGoToSpelling} className="mt-2">
                    스펠링 시작하기
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Target className="h-8 w-8 text-orange-600 mx-auto" />
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  아쉽다! 목표 점수는 80점이야
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  다시 도전해봐!
                </p>
              </>
            )}
          </CardContent>
        </Card>

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
            <Button onClick={handleRetryWrong} className={cn('w-full', !passed && 'ring-2 ring-orange-400')}>
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
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
            <Target className="h-3 w-3" />
            목표 80점
          </span>
          <ScoreBadges correct={score.correct} wrong={score.wrong} />
        </div>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-2xl font-medium">{question.front_text}</p>
        </CardContent>
      </Card>

      <MCQOptionList
        options={question.options}
        selectedAnswer={selectedAnswer}
        correctAnswer={question.correctIndex}
        showResult={showResult}
        onSelect={(v) => handleSelect(v as number)}
        labelStyle="alpha"
        className="max-w-md mx-auto"
      />

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
