'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import type { TranslationExerciseProps, SentenceData, GradingResult, WrongTranslation } from './translation-exercise';
import { logger } from '@/lib/logger';

export function SentenceBysentenceTranslation({ passage, onComplete, showWrongAlert, sentencesPerPage = 10 }: TranslationExerciseProps) {
  const sentences = passage.sentences! as SentenceData[];
  const totalPages = Math.ceil(sentences.length / sentencesPerPage);

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [pageResults, setPageResults] = useState<Record<number, Record<number, GradingResult>>>({});
  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);

  // All pages' results collected for final scoring
  const [allCorrectCount, setAllCorrectCount] = useState(0);
  const [allWrongs, setAllWrongs] = useState<WrongTranslation[]>([]);
  const [completed, setCompleted] = useState(false);

  const pageStart = currentPage * sentencesPerPage;
  const pageEnd = Math.min(pageStart + sentencesPerPage, sentences.length);
  const pageSentences = useMemo(
    () => sentences.slice(pageStart, pageEnd),
    [sentences, pageStart, pageEnd]
  );

  const currentResults = pageResults[currentPage] ?? null;
  const filledCount = pageSentences.filter((_, idx) => (answers[pageStart + idx] || '').trim().length > 0).length;
  const allFilled = filledCount === pageSentences.length;

  function updateAnswer(globalIdx: number, value: string) {
    setAnswers((prev) => ({ ...prev, [globalIdx]: value }));
  }

  async function handleSubmitPage() {
    if (!allFilled || grading) return;

    setGrading(true);
    setGradingError(null);

    try {
      const payload = pageSentences.map((s, localIdx) => ({
        koreanText: s.korean,
        originalText: s.original,
        studentAnswer: (answers[pageStart + localIdx] || '').trim(),
        ...(s.acceptedAnswers?.length ? { acceptedAnswers: s.acceptedAnswers } : {}),
      }));

      const res = await fetch('/api/naesin/passage/grade-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences: payload }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '채점 실패');
      }

      const data = await res.json();
      const apiResults: { score: number; feedback: string; correctedSentence: string }[] = data.results;

      const results: Record<number, GradingResult> = {};
      let pageCorrect = 0;
      const pageWrongs: WrongTranslation[] = [];

      apiResults.forEach((r, localIdx) => {
        const globalIdx = pageStart + localIdx;
        results[globalIdx] = r;

        if (r.score === 100) {
          pageCorrect++;
        } else {
          pageWrongs.push({
            type: 'translation',
            koreanText: pageSentences[localIdx].korean,
            userAnswer: (answers[globalIdx] || '').trim(),
            score: r.score,
            feedback: r.feedback,
          });
        }
      });

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
    } catch (err) {
      logger.error('shared.sentence_translation', { error: err instanceof Error ? err.message : String(err) });
      setGradingError(err instanceof Error ? err.message : '채점 중 오류가 발생했습니다');
    } finally {
      setGrading(false);
    }
  }

  function handleNextPage() {
    setCurrentPage((prev) => prev + 1);
  }

  function handleReset() {
    setAnswers({});
    setPageResults({});
    setCurrentPage(0);
    setAllCorrectCount(0);
    setAllWrongs([]);
    setCompleted(false);
    setGradingError(null);
  }

  const isPageGraded = currentResults !== null;
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="space-y-3">
      {/* 안내 배너 */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
        <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          한국어 해석을 보고 영어 원문을 그대로 작성하세요. AI가 채점합니다.
        </p>
      </div>

      {/* 진행률 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>페이지 {currentPage + 1}/{totalPages} (문장 {pageStart + 1}~{pageEnd})</span>
          {completed && (
            <Badge variant="secondary">
              {allCorrectCount}/{sentences.length} 정답
            </Badge>
          )}
        </div>
      )}

      {pageSentences.map((s, localIdx) => {
        const globalIdx = pageStart + localIdx;
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
          {filledCount}/{pageSentences.length} 문장 작성 완료
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
              <><Send className="h-4 w-4 mr-1" />제출하기 ({filledCount}/{pageSentences.length})</>
            )}
          </Button>
        ) : !isLastPage && !completed ? (
          <Button onClick={handleNextPage} className="w-full">
            다음 페이지
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleReset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-1" />
            다시 풀기
          </Button>
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
