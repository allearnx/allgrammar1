'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle, RotateCcw, ChevronRight } from 'lucide-react';
import type { TextbookPassage } from '@/types/database';

// ── 룰 기반 채점 유틸 (WholePassageTranslation fallback 전용) ──

/** 정규화: 소문자, 구두점 제거(아포스트로피 유지), 공백 통일 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 단어 배열의 LCS(최장 공통 부분수열) 길이 */
function lcsLength(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/** 원문과 학생 답안 비교 → 점수(0~100) — fallback 전용 */
function gradeAnswerLCS(original: string, student: string): number {
  const normOrig = normalize(original);
  const normStudent = normalize(student);

  if (normOrig === normStudent) return 100;

  const origWords = normOrig.split(' ');
  const studentWords = normStudent.split(' ');

  if (origWords.length === 0) return 0;

  const matchedCount = lcsLength(origWords, studentWords);
  const score = Math.round((matchedCount / origWords.length) * 100);

  return Math.min(score, 100);
}

/** 점수에 따른 피드백 메시지 (fallback 전용) */
function getFeedbackLCS(score: number): string {
  if (score === 100) return '완벽합니다!';
  if (score >= 90) return '거의 맞았어요! 조금만 더 확인해보세요.';
  if (score >= 70) return '잘 쓰고 있어요. 빠진 부분을 확인하세요.';
  if (score >= 50) return '절반 이상 맞았어요. 원문을 다시 확인하세요.';
  return '원문을 다시 읽고 도전해보세요.';
}

// ── 정확 매칭 채점 (문장별 영작) ──

interface SentenceData {
  original: string;
  korean: string;
  acceptedAnswers?: string[];
}

function gradeExact(sentence: SentenceData, studentAnswer: string): boolean {
  const trimmed = studentAnswer.trim();
  if (trimmed === sentence.original) return true;
  if (sentence.acceptedAnswers) {
    return sentence.acceptedAnswers.some((ans) => trimmed === ans);
  }
  return false;
}

// ── 타입 ──

interface GradingResult {
  score: number;
  feedback: string;
  correctedSentence: string;
}

interface WrongTranslation {
  type: 'translation';
  koreanText: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

interface TranslationExerciseProps {
  passage: TextbookPassage;
  onComplete: (score: number, wrongAnswers: WrongTranslation[]) => void;
  showWrongAlert?: boolean;
  rateLimitText?: string;
  sentencesPerPage?: number;
}

// ── 메인 컴포넌트 ──

export function TranslationExercise({ passage, onComplete, showWrongAlert, sentencesPerPage = 10 }: TranslationExerciseProps) {
  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;

  if (hasSentences) {
    return (
      <SentenceBysentenceTranslation
        passage={passage}
        onComplete={onComplete}
        showWrongAlert={showWrongAlert}
        sentencesPerPage={sentencesPerPage}
      />
    );
  }

  return (
    <WholePassageTranslation
      passage={passage}
      onComplete={onComplete}
      showWrongAlert={showWrongAlert}
    />
  );
}

// ── 문장별 영작 (정확 매칭 + 페이지 분할) ──

function SentenceBysentenceTranslation({ passage, onComplete, showWrongAlert, sentencesPerPage = 10 }: TranslationExerciseProps) {
  const sentences = passage.sentences! as SentenceData[];
  const totalPages = Math.ceil(sentences.length / sentencesPerPage);

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [pageResults, setPageResults] = useState<Record<number, Record<number, GradingResult>>>({});

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

  function handleSubmitPage() {
    if (!allFilled) return;

    const results: Record<number, GradingResult> = {};
    let pageCorrect = 0;
    const pageWrongs: WrongTranslation[] = [];

    pageSentences.forEach((s, localIdx) => {
      const globalIdx = pageStart + localIdx;
      const studentAnswer = (answers[globalIdx] || '').trim();
      const isCorrect = gradeExact(s, studentAnswer);
      const score = isCorrect ? 100 : 0;

      results[globalIdx] = {
        score,
        feedback: isCorrect ? '정답!' : '오답',
        correctedSentence: s.original,
      };

      if (isCorrect) {
        pageCorrect++;
      } else {
        pageWrongs.push({
          type: 'translation',
          koreanText: s.korean,
          userAnswer: studentAnswer,
          score: 0,
          feedback: '오답',
        });
      }
    });

    setPageResults((prev) => ({ ...prev, [currentPage]: results }));

    const newTotalCorrect = allCorrectCount + pageCorrect;
    const newAllWrongs = [...allWrongs, ...pageWrongs];
    setAllCorrectCount(newTotalCorrect);
    setAllWrongs(newAllWrongs);

    // If last page, finalize
    if (currentPage === totalPages - 1) {
      const totalScore = Math.round((newTotalCorrect / sentences.length) * 100);
      setCompleted(true);
      onComplete(totalScore, newAllWrongs);
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
  }

  const isPageGraded = currentResults !== null;
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="space-y-3">
      {/* 경고 배너 */}
      <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 border border-yellow-200 dark:border-yellow-800">
        <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          대소문자, 문장부호(마침표/쉼표), 공백이 정확해야 정답 처리됩니다.
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
                  placeholder="영어로 작성..."
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
                  {result.score === 0 && (
                    <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
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

      <div className="flex gap-2">
        {!isPageGraded ? (
          <Button onClick={handleSubmitPage} className="w-full" disabled={!allFilled}>
            <Send className="h-4 w-4 mr-1" />제출하기 ({filledCount}/{pageSentences.length})
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

// ── 전체 본문 영작 (fallback — 기존 LCS 유지) ──

function WholePassageTranslation({ passage, onComplete, showWrongAlert }: TranslationExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<GradingResult | null>(null);

  function handleSubmit() {
    if (!answer.trim()) return;

    const score = gradeAnswerLCS(passage.original_text, answer.trim());
    const data: GradingResult = {
      score,
      feedback: getFeedbackLCS(score),
      correctedSentence: passage.original_text,
    };
    setResult(data);

    const wrongs: WrongTranslation[] = score < 80
      ? [{ type: 'translation', koreanText: passage.korean_translation, userAnswer: answer.trim(), score, feedback: data.feedback }]
      : [];
    onComplete(score, wrongs);
  }

  function handleReset() {
    setAnswer('');
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground mb-2">다음 한국어를 영어로 작성하세요:</p>
          <p className="text-lg font-medium whitespace-pre-wrap">{passage.korean_translation}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="영어로 작성하세요..."
          rows={4}
          disabled={result !== null}
          className="resize-none"
        />
        <div className="flex justify-end">
          {result !== null ? (
            <Button onClick={handleReset} variant="outline">다시 작성</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!answer.trim()}>
              <Send className="h-4 w-4 mr-1" />제출
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
                <p className="text-sm font-medium mb-1">정답:</p>
                <p className="text-sm whitespace-pre-wrap">{result.correctedSentence}</p>
              </div>
            </CardContent>
          </Card>

          {showWrongAlert && result.score < 80 && (
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
