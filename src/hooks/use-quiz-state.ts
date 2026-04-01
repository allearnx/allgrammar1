import { useState, useRef, useEffect, useCallback } from 'react';
import { shuffle } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { useRetryWrong } from '@/hooks/use-retry-wrong';
import type { NaesinVocabulary, NaesinVocabQuizResult } from '@/types/database';

export interface QuizQuestion {
  front_text: string;
  correctAnswer: string;
  options: string[];
  correctIndex: number;
}

export interface WrongWord {
  front_text: string;
  back_text: string;
}

function generateQuizQuestions(vocabulary: NaesinVocabulary[], allVocabulary?: NaesinVocabulary[], targetVocab?: NaesinVocabulary[]): QuizQuestion[] {
  const quizWords = shuffle(targetVocab || vocabulary);
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

interface UseQuizStateOptions {
  vocabulary: NaesinVocabulary[];
  allVocabulary?: NaesinVocabulary[];
  unitId: string;
  onComplete: (score: number) => void;
  onQuizSetResult?: (score: number, wrongWords: WrongWord[]) => void;
  quizResultEndpoint?: string;
}

export function useQuizState({
  vocabulary,
  allVocabulary,
  unitId,
  onComplete,
  onQuizSetResult,
  quizResultEndpoint = '/api/naesin/vocab/quiz-result',
}: UseQuizStateOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
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

  const { previousCorrectCount: retryPreviousCorrectCount, isRetrying, startRetry, reset: resetRetry, getCombinedScore } = useRetryWrong();
  const totalOriginalCount = vocabulary.length;

  const question = questions[currentIndex];

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentIndex]);

  useEffect(() => {
    if (showResult) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showResult]);

  const saveQuizResult = useCallback(async (correctCount: number, pct: number, finalWrongWords: WrongWord[]) => {
    setSaving(true);
    try {
      const data = await fetchWithToast<{ result?: NaesinVocabQuizResult }>(quizResultEndpoint, {
        body: { unitId, score: pct, totalQuestions: totalOriginalCount, correctCount, wrongWords: finalWrongWords },
        silent: true,
        logContext: 'naesin.vocab_quiz',
      });
      if (data?.result) {
        setSavedResult(data.result);
        setAttemptNumber(data.result.attempt_number);
      }
    } catch { /* fetchWithToast handles logging */ }
    finally {
      setSaving(false);
      setQuizFinished(true);
    }
  }, [quizResultEndpoint, unitId, totalOriginalCount]);

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
      const finalWrong = correct
        ? wrongWords
        : [...wrongWords, { front_text: question.front_text, back_text: question.correctAnswer }];
      const combinedCorrect = retryPreviousCorrectCount + finalCorrect;
      const pct = getCombinedScore(finalCorrect, totalOriginalCount);
      onComplete(pct);
      saveQuizResult(combinedCorrect, pct, finalWrong);
      onQuizSetResult?.(pct, finalWrong);
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
    resetRetry();
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
    startRetry(score.correct);
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

  return {
    containerRef,
    resultRef,
    question,
    questions,
    currentIndex,
    selectedAnswer,
    showResult,
    score,
    wrongWords,
    quizFinished,
    savedResult,
    attemptNumber,
    saving,
    retryPreviousCorrectCount,
    isRetrying,
    totalOriginalCount,
    getCombinedScore,
    handleSelect,
    handleNext,
    handleRetryAll,
    handleRetryWrong,
    handleCopyLink,
  };
}
