'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRightLeft, PenLine, TextCursorInput, BookOpen, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderingExercise } from '@/components/shared/ordering-exercise';
import { TranslationExercise, type WrongTranslation } from '@/components/shared/translation-exercise';
import { FillBlanksExercise } from '@/components/shared/fill-blanks-exercise';
import { NaesinYouTubePlayerTracked } from '@/components/naesin/grammar-tab/youtube-player';
import { StageProgressBar } from '@/components/naesin/stage-progress-bar';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { extractVideoId } from '@/lib/utils/youtube';
import type { NaesinProblemSheet, NaesinEpVideoProgress } from '@/types/database';
import type { TextbookPassage, SentenceItem, BlankItem } from '@/types/textbook';
import type { ExternalPassageSentence } from '@/types/naesin';

/** 시트별 최근 시도 요약 (fetch-stage-data lastAttemptBySheet와 동일 형태) */
export interface ExternalPassageAttempt {
  score: number;
  total_questions: number;
  wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
  /** [빈칸, 순서, 영작] 세부 점수 */
  answers?: unknown;
  created_at: string;
}

/** 도전 기록 한 줄 (fetch-stage-data attemptHistoryBySheet와 동일 형태) */
export interface ExternalPassageAttemptBrief {
  score: number;
  /** [빈칸, 순서, 영작] 세부 점수 */
  answers?: unknown;
  created_at: string;
}

interface ExternalPassageViewProps {
  sheet: NaesinProblemSheet;
  unitId?: string | null;
  onComplete?: () => void;
  /** 이미 제출한 적이 있으면 완료 요약(다시 보기·다시 풀기)부터 보여준다 */
  lastAttempt?: ExternalPassageAttempt;
  /** 전체 시도 이력 (최신순) — 완료 요약의 "도전 기록" */
  history?: ExternalPassageAttemptBrief[];
}

type ExerciseKey = 'fillBlanks' | 'ordering' | 'translation';

function subScoresOf(attempt: ExternalPassageAttemptBrief | undefined): { fill: number | null; ordering: number; translation: number } | null {
  const a = attempt?.answers;
  if (!Array.isArray(a) || !a.every((n) => typeof n === 'number')) return null;
  if (a.length === 3) return { fill: a[0], ordering: a[1], translation: a[2] };
  if (a.length === 2) return { fill: null, ordering: a[0], translation: a[1] };
  return null;
}

function generateBlanks(originalText: string, interval: number): BlankItem[] {
  const words = originalText.trim().split(/\s+/);
  return words
    .map((w, i) => ({ index: i, answer: w }))
    .filter((_, i) => i % interval === interval - 1);
}

/** Convert sheet questions (ExternalPassageSentence[]) to a mock TextbookPassage for reuse */
function toTextbookPassage(sheet: NaesinProblemSheet): TextbookPassage {
  const sentences: SentenceItem[] = (sheet.questions as unknown as ExternalPassageSentence[]).map((q) => ({
    original: q.original,
    korean: q.korean,
    words: q.words,
    acceptedAnswers: q.acceptedAnswers,
  }));

  const originalText = sentences.map((s) => s.original).join(' ');

  return {
    id: sheet.id,
    grammar_id: '',
    title: sheet.title,
    original_text: originalText,
    korean_translation: sentences.map((s) => s.korean).join(' '),
    blanks_easy: generateBlanks(originalText, 5),
    blanks_medium: generateBlanks(originalText, 3),
    blanks_hard: generateBlanks(originalText, 2),
    sentences,
    is_textbook_mode_active: true,
    created_at: sheet.created_at,
  };
}

const DRAFT_KEY = (id: string) => `ext_passage_draft_${id}`;

interface Draft { fillBlanks?: number; ordering?: number; translation?: number; translationWrongs?: WrongTranslation[] }

function loadDraft(sheetId: string): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(sheetId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// 세 연습(빈칸·순서·영작)의 완료 점수를 모두 임시 저장 — 페이지를 나갔다 와도 끝낸 연습은 유지
function saveDraft(sheetId: string, data: Partial<Draft>) {
  try {
    const prev = loadDraft(sheetId);
    if (data.fillBlanks != null) prev.fillBlanks = data.fillBlanks;
    if (data.ordering != null) prev.ordering = data.ordering;
    if (data.translation != null) prev.translation = data.translation;
    if (data.translationWrongs) prev.translationWrongs = data.translationWrongs;
    localStorage.setItem(DRAFT_KEY(sheetId), JSON.stringify(prev));
  } catch { /* ignore */ }
}

function clearDraft(sheetId: string) {
  try { localStorage.removeItem(DRAFT_KEY(sheetId)); } catch { /* ignore */ }
}

/** 연습 하나만 임시 저장에서 지운다 (그 연습만 다시 하기) */
function dropDraft(sheetId: string, key: ExerciseKey) {
  try {
    const prev = loadDraft(sheetId);
    delete prev[key];
    if (key === 'translation') delete prev.translationWrongs;
    localStorage.setItem(DRAFT_KEY(sheetId), JSON.stringify(prev));
  } catch { /* ignore */ }
}

export function ExternalPassageView({ sheet, unitId, onComplete, lastAttempt, history }: ExternalPassageViewProps) {
  const draft = useMemo(() => loadDraft(sheet.id), [sheet.id]);
  const [fillBlanksScore, setFillBlanksScore] = useState<number | null>(draft.fillBlanks ?? null);
  const [orderingScore, setOrderingScore] = useState<number | null>(draft.ordering ?? null);
  const [translationScore, setTranslationScore] = useState<number | null>(draft.translation ?? null);
  const [translationWrongs, setTranslationWrongs] = useState<WrongTranslation[]>(draft.translationWrongs ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // 이전 제출 기록이 있으면 완료 요약부터. 임시 저장(풀던 중)이 있으면 그걸 우선 — 이어서 풀게
  const hasDraft = draft.fillBlanks != null || draft.ordering != null || draft.translation != null;
  const [retrying, setRetrying] = useState(hasDraft);
  const [showPassage, setShowPassage] = useState(false);
  // 리마운트 없이 연습 컴포넌트를 초기화하기 위한 키
  const [attemptKey, setAttemptKey] = useState(0);
  // 연습 하나만 다시 할 때 그 연습만 초기화하는 키
  const [exerciseKeys, setExerciseKeys] = useState<Record<ExerciseKey, number>>({ fillBlanks: 0, ordering: 0, translation: 0 });
  // 이번 세션에서 제출한 기록 — 서버 이력 앞에 붙여 새로고침 없이도 "도전 기록"이 늘어난다
  const [sessionAttempts, setSessionAttempts] = useState<ExternalPassageAttemptBrief[]>([]);

  // Video progress state
  const [videoProgress, setVideoProgress] = useState<NaesinEpVideoProgress | null>(null);
  const [videoWatchPercent, setVideoWatchPercent] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);

  const passage = useMemo(() => toTextbookPassage(sheet), [sheet]);
  const youtubeId = useMemo(
    () => (sheet.video_url ? extractVideoId(sheet.video_url) : null),
    [sheet.video_url],
  );

  // Fetch initial video progress for resume playback
  useEffect(() => {
    if (!youtubeId) return;
    fetch(`/api/naesin/external-passage/video-progress?sheetId=${sheet.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.progress) {
          setVideoProgress(data.progress);
          setVideoWatchPercent(data.progress.watch_percent);
          setVideoCompleted(data.progress.completed);
        }
      })
      .catch(() => {});
  }, [youtubeId, sheet.id]);

  const handleFillBlanksComplete = useCallback((score: number) => {
    setFillBlanksScore(score);
    saveDraft(sheet.id, { fillBlanks: score });
  }, [sheet.id]);

  const handleOrderingComplete = useCallback((score: number) => {
    setOrderingScore(score);
    saveDraft(sheet.id, { ordering: score });
  }, [sheet.id]);

  const handleTranslationComplete = useCallback((score: number, wrongs: WrongTranslation[]) => {
    setTranslationScore(score);
    setTranslationWrongs(wrongs);
    saveDraft(sheet.id, { translation: score, translationWrongs: wrongs });
  }, [sheet.id]);

  /** 연습 하나만 다시 하기 — 셋을 다 끝내기 전에도 언제든 (사장님·학생 요청 9/24: "한 번 하면 더 못한다") */
  function resetExercise(key: ExerciseKey) {
    dropDraft(sheet.id, key);
    if (key === 'fillBlanks') setFillBlanksScore(null);
    if (key === 'ordering') setOrderingScore(null);
    if (key === 'translation') { setTranslationScore(null); setTranslationWrongs([]); }
    setExerciseKeys((k) => ({ ...k, [key]: k[key] + 1 }));
  }

  function startRetry() {
    clearDraft(sheet.id);
    setFillBlanksScore(null);
    setOrderingScore(null);
    setTranslationScore(null);
    setTranslationWrongs([]);
    setSubmitted(false);
    setShowPassage(false);
    setAttemptKey((k) => k + 1);
    setRetrying(true);
  }

  const allDone = fillBlanksScore !== null && orderingScore !== null && translationScore !== null;

  async function handleSubmit() {
    if (!allDone || submitting) return;
    setSubmitting(true);

    const wrongSentences = [
      ...translationWrongs.map((w, i) => ({
        number: i + 1,
        type: 'translation' as const,
        userAnswer: w.userAnswer,
        correctAnswer: w.correctAnswer || '',
      })),
    ];

    try {
      await fetchWithToast('/api/naesin/problems/submit-passage', {
        body: {
          sheetId: sheet.id,
          unitId,
          fillBlanksScore,
          orderingScore,
          translationScore,
          wrongSentences,
        },
        silent: true,
        retry: 2,
      });
      clearDraft(sheet.id);
      setSubmitted(true);
      setSessionAttempts((prev) => [{
        score: Math.round(((fillBlanksScore ?? 0) + (orderingScore ?? 0) + (translationScore ?? 0)) / 3),
        answers: [fillBlanksScore, orderingScore, translationScore],
        created_at: new Date().toISOString(),
      }, ...prev]);
      onComplete?.();
    } catch {
      // handled by fetchWithToast
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-submit when all exercises are done
  useEffect(() => {
    if (allDone && !submitted && !submitting) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const sessionAvg = allDone ? Math.round((fillBlanksScore + orderingScore + translationScore) / 3) : null;
  const prevSub = subScoresOf(lastAttempt);
  // 완료 요약: 이번 세션 제출 → 세션 점수, 아니면 이전 제출 기록
  const showSummary = submitted || (!retrying && !!lastAttempt);
  const summary = submitted && sessionAvg !== null
    ? { avg: sessionAvg, fill: fillBlanksScore, ordering: orderingScore, translation: translationScore }
    : lastAttempt
      ? { avg: lastAttempt.score, fill: prevSub?.fill ?? null, ordering: prevSub?.ordering ?? null, translation: prevSub?.translation ?? null }
      : null;
  const sentences = sheet.questions as unknown as ExternalPassageSentence[];
  const allAttempts = [...sessionAttempts, ...(history ?? [])];
  const bestScore = allAttempts.length > 0 ? Math.max(...allAttempts.map((a) => a.score)) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{sheet.title}</h3>
        <Badge variant="secondary">외부지문</Badge>
      </div>

      {youtubeId && (
        <div className="space-y-2">
          <NaesinYouTubePlayerTracked
            videoId={youtubeId}
            lessonId={sheet.id}
            unitId={unitId ?? ''}
            onVideoProgress={(percent, completed) => {
              setVideoWatchPercent(percent);
              if (completed) setVideoCompleted(true);
            }}
            initialProgress={
              videoProgress
                ? {
                    id: videoProgress.id,
                    student_id: videoProgress.student_id,
                    lesson_id: videoProgress.sheet_id,
                    watch_percent: videoProgress.watch_percent,
                    max_position_reached: videoProgress.max_position_reached,
                    duration: videoProgress.duration,
                    cumulative_watch_seconds: videoProgress.cumulative_watch_seconds,
                    last_position: videoProgress.last_position,
                    completed: videoProgress.completed,
                    updated_at: videoProgress.updated_at,
                  }
                : undefined
            }
            progressEndpoint="/api/naesin/external-passage/video-progress"
          />
          {!videoCompleted && videoWatchPercent > 0 && (
            <StageProgressBar label="시청 진도" percent={videoWatchPercent} />
          )}
          {videoCompleted && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              영상 시청 완료
            </Badge>
          )}
        </div>
      )}

      {showSummary && summary && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="text-center space-y-1">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
            <p className="text-3xl font-bold">{summary.avg}점</p>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              {summary.fill !== null && <span>빈칸 {summary.fill}점</span>}
              {summary.ordering !== null && <span>순서배열 {summary.ordering}점</span>}
              {summary.translation !== null && <span>영작 {summary.translation}점</span>}
            </div>
            {!submitted && lastAttempt && (
              <p className="text-xs text-muted-foreground">{new Date(lastAttempt.created_at).toLocaleDateString('ko-KR')} 제출</p>
            )}
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={() => setShowPassage((v) => !v)}>
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              본문 다시 보기
              {showPassage ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
            </Button>
            <Button size="sm" onClick={startRetry}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              다시 풀기
            </Button>
          </div>
          {allAttempts.length > 0 && (
            <div className="rounded-md border bg-background px-3 py-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">도전 기록 {allAttempts.length}회</span>
                {bestScore !== null && <span className="text-muted-foreground">최고 {bestScore}점</span>}
              </div>
              <ol className="space-y-0.5 text-muted-foreground">
                {allAttempts.slice(0, 5).map((a, i) => {
                  const sub = subScoresOf(a);
                  const n = allAttempts.length - i;
                  return (
                    <li key={a.created_at + i} className="flex justify-between gap-2">
                      <span>{n}회 · {new Date(a.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                      <span>
                        <span className="font-medium text-foreground">{a.score}점</span>
                        {sub && (
                          <span className="ml-1">
                            (빈칸 {sub.fill ?? '-'} · 순서 {sub.ordering} · 영작 {sub.translation})
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          {showPassage && (
            <ol className="space-y-2 text-sm">
              {sentences.map((q, i) => (
                <li key={i} className="rounded-md bg-background border px-3 py-2">
                  <p className="font-medium">{i + 1}. {q.original}</p>
                  <p className="text-muted-foreground mt-0.5">{q.korean}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {!showSummary && (
        <Tabs key={attemptKey} defaultValue="fillBlanks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fillBlanks" className="gap-1.5">
              <TextCursorInput className="h-3.5 w-3.5" />
              빈칸
              {fillBlanksScore !== null && (
                <Badge variant="outline" className="ml-1 text-xs">{fillBlanksScore}점</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ordering" className="gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              순서
              {orderingScore !== null && (
                <Badge variant="outline" className="ml-1 text-xs">{orderingScore}점</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="translation" className="gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              영작
              {translationScore !== null && (
                <Badge variant="outline" className="ml-1 text-xs">{translationScore}점</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fillBlanks" className="mt-4">
            {fillBlanksScore !== null ? (
              <div className="text-center py-8 text-muted-foreground space-y-3">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                <p>빈칸 채우기 완료! ({fillBlanksScore}점)</p>
                <Button variant="outline" size="sm" onClick={() => resetExercise('fillBlanks')}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  빈칸 채우기 다시 하기
                </Button>
              </div>
            ) : (
              <FillBlanksExercise
                key={exerciseKeys.fillBlanks}
                passage={passage}
                onComplete={handleFillBlanksComplete}
              />
            )}
          </TabsContent>

          <TabsContent value="ordering" className="mt-4">
            {orderingScore !== null ? (
              <div className="text-center py-8 text-muted-foreground space-y-3">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                <p>순서 배열 완료! ({orderingScore}점)</p>
                <Button variant="outline" size="sm" onClick={() => resetExercise('ordering')}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  순서 배열 다시 하기
                </Button>
              </div>
            ) : (
              <OrderingExercise
                key={exerciseKeys.ordering}
                passage={passage}
                onComplete={handleOrderingComplete}
              />
            )}
          </TabsContent>

          <TabsContent value="translation" className="mt-4">
            {translationScore !== null ? (
              <div className="text-center py-8 text-muted-foreground space-y-3">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                <p>영작 완료! ({translationScore}점)</p>
                <Button variant="outline" size="sm" onClick={() => resetExercise('translation')}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  영작 다시 하기
                </Button>
              </div>
            ) : (
              <TranslationExercise
                key={exerciseKeys.translation}
                passage={passage}
                onComplete={handleTranslationComplete}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
