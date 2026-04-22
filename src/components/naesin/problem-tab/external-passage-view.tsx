'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRightLeft, PenLine, TextCursorInput } from 'lucide-react';
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

interface ExternalPassageViewProps {
  sheet: NaesinProblemSheet;
  unitId?: string | null;
  onComplete?: () => void;
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

function loadDraft(sheetId: string): { fillBlanks?: number; ordering?: number } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(sheetId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDraft(sheetId: string, data: { fillBlanks?: number | null; ordering?: number | null }) {
  try {
    const prev = loadDraft(sheetId);
    if (data.fillBlanks != null) prev.fillBlanks = data.fillBlanks;
    if (data.ordering != null) prev.ordering = data.ordering;
    localStorage.setItem(DRAFT_KEY(sheetId), JSON.stringify(prev));
  } catch { /* ignore */ }
}

function clearDraft(sheetId: string) {
  try { localStorage.removeItem(DRAFT_KEY(sheetId)); } catch { /* ignore */ }
}

export function ExternalPassageView({ sheet, unitId, onComplete }: ExternalPassageViewProps) {
  const draft = useMemo(() => loadDraft(sheet.id), [sheet.id]);
  const [fillBlanksScore, setFillBlanksScore] = useState<number | null>(draft.fillBlanks ?? null);
  const [orderingScore, setOrderingScore] = useState<number | null>(draft.ordering ?? null);
  const [translationScore, setTranslationScore] = useState<number | null>(null);
  const [translationWrongs, setTranslationWrongs] = useState<WrongTranslation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
  }, []);

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
      });
      clearDraft(sheet.id);
      setSubmitted(true);
      onComplete?.();
    } catch {
      // handled by fetchWithToast
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-submit when all exercises are done
  if (allDone && !submitted && !submitting) {
    handleSubmit();
  }

  const avgScore = allDone ? Math.round((fillBlanksScore + orderingScore + translationScore) / 3) : null;

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

      {submitted && avgScore !== null && (
        <div className="text-center py-4 space-y-2">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
          <p className="text-3xl font-bold">{avgScore}점</p>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span>빈칸 {fillBlanksScore}점</span>
            <span>순서배열 {orderingScore}점</span>
            <span>영작 {translationScore}점</span>
          </div>
        </div>
      )}

      {!submitted && (
        <Tabs defaultValue="fillBlanks" className="w-full">
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
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p>빈칸 채우기 완료! ({fillBlanksScore}점)</p>
              </div>
            ) : (
              <FillBlanksExercise
                passage={passage}
                onComplete={handleFillBlanksComplete}
              />
            )}
          </TabsContent>

          <TabsContent value="ordering" className="mt-4">
            {orderingScore !== null ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p>순서 배열 완료! ({orderingScore}점)</p>
              </div>
            ) : (
              <OrderingExercise
                passage={passage}
                onComplete={handleOrderingComplete}
              />
            )}
          </TabsContent>

          <TabsContent value="translation" className="mt-4">
            {translationScore !== null ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p>영작 완료! ({translationScore}점)</p>
              </div>
            ) : (
              <TranslationExercise
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
