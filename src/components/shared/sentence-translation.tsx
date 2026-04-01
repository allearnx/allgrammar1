'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle, RotateCcw, ChevronRight, Loader2, ListRestart } from 'lucide-react';
import type { TranslationExerciseProps, SentenceData, GradingResult, WrongTranslation } from './translation-exercise';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { useRetryWrong } from '@/hooks/use-retry-wrong';

export function SentenceBysentenceTranslation({ passage, onComplete, showWrongAlert, sentencesPerPage = 10 }: TranslationExerciseProps) {
  const sentences = passage.sentences! as SentenceData[];
  const totalPages = Math.ceil(sentences.length / sentencesPerPage);

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [pageResults, setPageResults] = useState<Record<number, Record<number, GradingResult>>>({});
  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);

  const [allCorrectCount, setAllCorrectCount] = useState(0);
  const [allWrongs, setAllWrongs] = useState<WrongTranslation[]>([]);
  const [completed, setCompleted] = useState(false);

  // Retry-wrong-only state
  const [retryMode, setRetryMode] = useState(false);
  const [retryWrongIndices, setRetryWrongIndices] = useState<number[]>([]);
  const { previousCorrectCount: retryPreviousCorrectCount, startRetry, reset: resetRetry, getCombinedScore } = useRetryWrong();

  // In retry mode, show only wrong sentences (single page)
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
            score: r.score,
            feedback: r.feedback,
          });
        }
      });

      if (retryMode) {
        // Store retry results under key -1
        setPageResults((prev) => ({ ...prev, [-1]: results }));

        // Combine: previous correct + newly correct in this retry
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
      // fetchWithToast already toasts; store the message for inline display
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

    // Collect wrong sentence indices from all page results
    const wrongIndices: number[] = [];
    let correctSoFar = 0;

    if (retryMode) {
      // In retry-of-retry: check retry results (key -1)
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
      // First retry: check all page results
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

    // Clear answers for wrong sentences
    const newAnswers: Record<number, string> = {};
    // Keep no answers — user must re-type

    setRetryWrongIndices(wrongIndices);
    startRetry(correctSoFar);
    setAnswers(newAnswers);
    setPageResults((prev) => {
      const next = { ...prev };
      delete next[-1]; // clear old retry results
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

  return (
    <div className="space-y-3">
      {/* 안내 배너 */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
        <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          한국어 해석을 보고 영어 원문을 그대로 작성하세요. AI가 채점합니다.
        </p>
      </div>

      {retryMode && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
          <ListRestart className="h-3.5 w-3.5 shrink-0" />
          틀린 {retryWrongIndices.length}문장만 다시 풀어보세요
        </div>
      )}

      {/* 진행률 */}
      {!retryMode && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>페이지 {currentPage + 1}/{totalPages} (문장 {currentPage * sentencesPerPage + 1}~{Math.min((currentPage + 1) * sentencesPerPage, sentences.length)})</span>
          {completed && (
            <Badge variant="secondary">
              {allCorrectCount}/{sentences.length} 정답
            </Badge>
          )}
        </div>
      )}

      {effectiveSentences.map(({ sentence: s, globalIdx }) => {
        const result = currentResults?.[globalIdx];
        return (
          <Card key={globalIdx} className={result ? (result.score === 100 ? 'border-green-500' : 'border-red-500') : ''}>
            <CardContent className="py-3 px-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="text-xs font-medium mr-1">{globalIdx + 1}.</span>
                {s.korean}
              </p>
              {!isPageGraded ? (
                <Textarea
                  className="text-sm min-h-[2.5rem] resize-none"
                  rows={1}
                  value={answers[globalIdx] || ''}
                  onChange={(e) => updateAnswer(globalIdx, e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  placeholder="영어로 작성..."
                  disabled={grading}
                  autoComplete="off"
                />
              ) : result ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{answers[globalIdx]}</p>
                    <Badge
                      variant={result.score === 100 ? 'default' : 'secondary'}
                      className={result.score === 100 ? 'bg-green-500 shrink-0' : 'shrink-0'}
                    >
                      {result.score === 100 ? '정답' : '오답'}
                    </Badge>
                  </div>
                  {result.score < 100 && (
                    <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
                      {result.feedback && <p className="text-muted-foreground">{result.feedback}</p>}
                      <p className="font-medium">정답: {result.correctedSentence}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {!isPageGraded && !allFilled && filledCount > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {filledCount}/{effectiveSentences.length} 문장 작성 완료
        </p>
      )}

      {gradingError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {gradingError}
        </div>
      )}

      <div className="flex gap-2">
        {!isPageGraded ? (
          <Button onClick={handleSubmitPage} className="w-full" disabled={!allFilled || grading}>
            {grading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" />채점 중...</>
            ) : (
              <><Send className="h-4 w-4 mr-1" />제출하기 ({filledCount}/{effectiveSentences.length})</>
            )}
          </Button>
        ) : !isLastPage && !completed ? (
          <Button onClick={handleNextPage} className="w-full">
            다음 페이지
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
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

      {completed && showWrongAlert && allWrongs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          오답이 기록되었습니다. 오답을 써서 선생님에게 제출하세요.
        </div>
      )}
    </div>
  );
}
