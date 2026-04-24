import { useState, useMemo } from 'react';
import type { SentenceData, GradingResult, WrongTranslation } from '@/components/shared/translation-exercise';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { useRetryWrong } from '@/hooks/use-retry-wrong';

interface UseSentenceTranslationStateParams {
  sentences: SentenceData[];
  sentencesPerPage: number;
  onComplete: (score: number, wrongs: WrongTranslation[]) => void;
  onPageWrongs?: (wrongs: WrongTranslation[]) => void;
}

export function useSentenceTranslationState({
  sentences,
  sentencesPerPage,
  onComplete,
  onPageWrongs,
}: UseSentenceTranslationStateParams) {
  const totalPages = Math.ceil(sentences.length / sentencesPerPage);

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [pageResults, setPageResults] = useState<Record<number, Record<number, GradingResult>>>({});
  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);

  const [allCorrectCount, setAllCorrectCount] = useState(0);
  const [allWrongs, setAllWrongs] = useState<WrongTranslation[]>([]);
  const [completed, setCompleted] = useState(false);

  const [retryMode, setRetryMode] = useState(false);
  const [retryWrongIndices, setRetryWrongIndices] = useState<number[]>([]);
  const { previousCorrectCount: retryPreviousCorrectCount, startRetry, reset: resetRetry, getCombinedScore } = useRetryWrong();

  const effectiveSentences = useMemo(() => {
    if (retryMode) {
      return retryWrongIndices.map((gi) => ({ sentence: sentences[gi], globalIdx: gi }));
    }
    const pageStart = currentPage * sentencesPerPage;
    const pageEnd = Math.min(pageStart + sentencesPerPage, sentences.length);
    return sentences.slice(pageStart, pageEnd).map((s, i) => ({ sentence: s, globalIdx: pageStart + i }));
  }, [retryMode, retryWrongIndices, sentences, currentPage, sentencesPerPage]);

  const currentResults = retryMode ? (pageResults[-1] ?? null) : (pageResults[currentPage] ?? null);
  const filledCount = effectiveSentences.filter(({ globalIdx }) => (answers[globalIdx] || '').trim().length > 0).length;
  const allFilled = filledCount === effectiveSentences.length;

  function updateAnswer(globalIdx: number, value: string) {
    setAnswers((prev) => ({ ...prev, [globalIdx]: value }));
  }

  async function handleSubmitPage() {
    if (!allFilled || grading) return;

    setGrading(true);
    setGradingError(null);

    try {
      const payload = effectiveSentences.map(({ sentence: s, globalIdx }) => ({
        koreanText: s.korean,
        originalText: s.original,
        studentAnswer: (answers[globalIdx] || '').trim(),
        ...(s.acceptedAnswers?.length ? { acceptedAnswers: s.acceptedAnswers } : {}),
      }));

      const data = await fetchWithToast<{ results: { score: number; feedback: string; correctedSentence: string }[] }>('/api/naesin/passage/grade-translation', {
        body: { sentences: payload },
        errorMessage: '채점 실패',
        logContext: 'shared.sentence_translation',
      });

      const apiResults = data.results;

      const results: Record<number, GradingResult> = {};
      let pageCorrect = 0;
      const pageWrongs: WrongTranslation[] = [];

      apiResults.forEach((r, localIdx) => {
        const { globalIdx, sentence: s } = effectiveSentences[localIdx];
        results[globalIdx] = r;

        if (r.score === 100) {
          pageCorrect++;
        } else {
          pageWrongs.push({
            type: 'translation',
            koreanText: s.korean,
            userAnswer: (answers[globalIdx] || '').trim(),
            correctAnswer: s.original,
            score: r.score,
            feedback: r.feedback,
          });
        }
      });

      if (!retryMode && pageWrongs.length > 0) {
        onPageWrongs?.(pageWrongs);
      }

      if (retryMode) {
        setPageResults((prev) => ({ ...prev, [-1]: results }));
        const totalCorrect = retryPreviousCorrectCount + pageCorrect;
        const totalScore = getCombinedScore(pageCorrect, sentences.length);
        setAllCorrectCount(totalCorrect);
        setAllWrongs(pageWrongs);
        setCompleted(true);
        onComplete(totalScore, pageWrongs);
      } else {
        setPageResults((prev) => ({ ...prev, [currentPage]: results }));
        const newTotalCorrect = allCorrectCount + pageCorrect;
        const newAllWrongs = [...allWrongs, ...pageWrongs];
        setAllCorrectCount(newTotalCorrect);
        setAllWrongs(newAllWrongs);

        if (currentPage === totalPages - 1) {
          const totalScore = Math.round((newTotalCorrect / sentences.length) * 100);
          setCompleted(true);
          onComplete(totalScore, newAllWrongs);
        }
      }
    } catch (err) {
      setGradingError(err instanceof Error ? err.message : '채점 중 오류가 발생했습니다');
    } finally {
      setGrading(false);
    }
  }

  function handleNextPage() {
    setCurrentPage((prev) => prev + 1);
  }

  function handleRetryWrong() {
    if (!completed) return;

    const wrongIndices: number[] = [];
    let correctSoFar = 0;

    if (retryMode) {
      const retryResults = pageResults[-1];
      for (const gi of retryWrongIndices) {
        const r = retryResults?.[gi];
        if (r && r.score === 100) {
          correctSoFar++;
        } else {
          wrongIndices.push(gi);
        }
      }
    } else {
      for (let gi = 0; gi < sentences.length; gi++) {
        const pageIdx = Math.floor(gi / sentencesPerPage);
        const r = pageResults[pageIdx]?.[gi];
        if (r && r.score === 100) {
          correctSoFar++;
        } else {
          wrongIndices.push(gi);
        }
      }
    }

    if (wrongIndices.length === 0) return;

    const newAnswers: Record<number, string> = {};

    setRetryWrongIndices(wrongIndices);
    startRetry(correctSoFar);
    setAnswers(newAnswers);
    setPageResults((prev) => {
      const next = { ...prev };
      delete next[-1];
      return next;
    });
    setAllWrongs([]);
    setCompleted(false);
    setGradingError(null);
    setRetryMode(true);
  }

  function handleReset() {
    setAnswers({});
    setPageResults({});
    setCurrentPage(0);
    setAllCorrectCount(0);
    setAllWrongs([]);
    setCompleted(false);
    setGradingError(null);
    setRetryMode(false);
    setRetryWrongIndices([]);
    resetRetry();
  }

  const isPageGraded = currentResults !== null;
  const isLastPage = retryMode ? true : currentPage === totalPages - 1;
  const wrongCount = completed ? allWrongs.length : 0;

  return {
    // State
    currentPage,
    answers,
    grading,
    gradingError,
    allCorrectCount,
    completed,
    retryMode,
    retryWrongIndices,
    totalPages,
    effectiveSentences,
    currentResults,
    filledCount,
    allFilled,
    isPageGraded,
    isLastPage,
    wrongCount,
    // Handlers
    updateAnswer,
    handleSubmitPage,
    handleNextPage,
    handleRetryWrong,
    handleReset,
  };
}
