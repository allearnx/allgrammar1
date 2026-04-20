'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Lock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DialogueLineOrdering } from '@/components/shared/dialogue-line-ordering';
import { FirstLetterExercise } from '@/components/shared/first-letter-exercise';
import { TranslationExercise } from '@/components/shared/translation-exercise';
import type { NaesinDialogue } from '@/types/naesin';
import type { TextbookPassage } from '@/types/database';

const CHUNK_SIZE = 10;

interface DialogueTabProps {
  dialogues: NaesinDialogue[];
  unitId: string;
  onStageComplete: () => void;
  naesinRequiredRounds?: number;
  round1Completed?: boolean;
}

function dialogueToChunkPassage(dialogue: NaesinDialogue, chunkSentences: NaesinDialogue['sentences']): TextbookPassage {
  const sentences = chunkSentences.map((s) => ({
    original: s.original,
    korean: s.speaker ? `[${s.speaker}] ${s.korean}` : s.korean,
    words: s.original.split(/\s+/).filter(Boolean),
  }));

  return {
    id: dialogue.id,
    grammar_id: '',
    title: dialogue.title,
    original_text: chunkSentences.map((s) => s.original).join(' '),
    korean_translation: chunkSentences.map((s) => s.korean).join(' '),
    blanks_easy: null,
    blanks_medium: null,
    blanks_hard: null,
    sentences,
    is_textbook_mode_active: true,
    created_at: dialogue.created_at,
  };
}

type DialogueExerciseType = 'ordering' | 'first_letter' | 'translation';

interface ChunkProgress {
  idx: number;
  totalCorrect: number;
}

function makeInitialChunkProgress(): Record<DialogueExerciseType, ChunkProgress> {
  return {
    ordering: { idx: 0, totalCorrect: 0 },
    first_letter: { idx: 0, totalCorrect: 0 },
    translation: { idx: 0, totalCorrect: 0 },
  };
}

function makeNullPending(): Record<DialogueExerciseType, number | null> {
  return { ordering: null, first_letter: null, translation: null };
}

export function DialogueTab({ dialogues, unitId, onStageComplete, naesinRequiredRounds, round1Completed }: DialogueTabProps) {
  const hasRound2 = (naesinRequiredRounds ?? 1) >= 2;
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DialogueExerciseType>('ordering');
  const [chunkProgress, setChunkProgress] = useState(makeInitialChunkProgress);
  const [pendingNext, setPendingNext] = useState(makeNullPending);
  const [prevProgressKey, setPrevProgressKey] = useState('');

  const dialogue = dialogues.length > 0 ? dialogues[currentIndex] : null;

  // Reset chunk progress when dialogue or round changes
  const progressKey = dialogue ? `${dialogue.id}-${currentRound}` : '';
  if (progressKey !== prevProgressKey && progressKey !== '') {
    setPrevProgressKey(progressKey);
    setChunkProgress(makeInitialChunkProgress());
    setPendingNext(makeNullPending());
  }

  const allSentences = dialogue?.sentences ?? [];
  const totalChunks = Math.ceil(allSentences.length / CHUNK_SIZE) || 1;
  const chunks = useMemo(
    () =>
      allSentences.length === 0
        ? [[] as NaesinDialogue['sentences']]
        : Array.from({ length: totalChunks }, (_, i) =>
            allSentences.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
          ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dialogue?.id, totalChunks],
  );

  if (!dialogue) {
    return (
      <div className="flex flex-col items-center py-12">
        <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          등록된 대화문이 없습니다.
        </p>
      </div>
    );
  }

  // ── Save helpers ──

  async function saveWrongAnswers(wrongItems: unknown[], sourceType: string = 'translation') {
    if (wrongItems.length === 0) return;
    try {
      await fetchWithToast('/api/naesin/wrong-answers', {
        body: {
          unitId,
          stage: 'dialogue',
          sourceType,
          wrongAnswers: wrongItems,
          round: currentRound,
        },
        silent: true,
        logContext: 'naesin.dialogue_tab.wrong_answers',
      });
    } catch {
      // error already toasted by fetchWithToast
    }
  }

  async function saveDialogueProgress(score: number, type: DialogueExerciseType) {
    try {
      const data = await fetchWithToast<{ dialogueCompleted?: boolean }>('/api/naesin/dialogue/progress', {
        body: { unitId, score, round: String(currentRound), type },
        errorMessage: '진도 저장 중 오류가 발생했습니다',
        logContext: 'naesin.dialogue_tab',
      });
      if (data.dialogueCompleted) {
        if (hasRound2 && currentRound === 1) {
          toast.success('1회독 완료! 2회독을 시작하세요');
        } else {
          toast.success('대화문 암기 단계를 완료했습니다!');
        }
        onStageComplete();
      }
    } catch {
      // error already toasted by fetchWithToast
    }
  }

  // ── Chunk logic ──

  function handleExerciseComplete(type: DialogueExerciseType, wrongs: unknown[], skipWrongSave = false) {
    if (!skipWrongSave && wrongs.length > 0) saveWrongAnswers(wrongs, type);

    const progress = chunkProgress[type];
    const chunkSize = chunks[progress.idx].length;
    const correctInChunk = chunkSize - wrongs.length;
    const newTotalCorrect = progress.totalCorrect + correctInChunk;

    if (progress.idx < totalChunks - 1) {
      // Non-final chunk: show "다음 묶음" button
      setPendingNext((prev) => ({ ...prev, [type]: wrongs.length }));
    } else {
      // Final chunk: save accumulated progress
      const finalScore = Math.round((newTotalCorrect / allSentences.length) * 100);
      saveDialogueProgress(finalScore, type);
    }
  }

  function handleNextChunk(type: DialogueExerciseType) {
    const wrongCount = pendingNext[type];
    if (wrongCount === null) return;

    const progress = chunkProgress[type];
    const chunkSize = chunks[progress.idx].length;
    const correctInChunk = chunkSize - wrongCount;
    const newTotalCorrect = progress.totalCorrect + correctInChunk;

    setChunkProgress((prev) => ({
      ...prev,
      [type]: { idx: progress.idx + 1, totalCorrect: newTotalCorrect },
    }));
    setPendingNext((prev) => ({ ...prev, [type]: null }));
  }

  // ── Render ──

  const round2Locked = hasRound2 && currentRound === 2 && !round1Completed;
  const orderingIdx = chunkProgress.ordering.idx;
  const firstLetterIdx = chunkProgress.first_letter.idx;
  const translationIdx = chunkProgress.translation.idx;
  const showChunkInfo = totalChunks > 1;

  function NextChunkButton({ type }: { type: DialogueExerciseType }) {
    if (pendingNext[type] === null) return null;
    const nextNum = chunkProgress[type].idx + 2;
    return (
      <Button onClick={() => handleNextChunk(type)} className="w-full mt-4" size="lg">
        다음 묶음으로 ({nextNum}/{totalChunks})
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Round toggle */}
      {hasRound2 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentRound(1)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
              currentRound === 1
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted border-border',
            )}
          >
            1회독
          </button>
          <button
            type="button"
            onClick={() => round1Completed && setCurrentRound(2)}
            disabled={!round1Completed}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
              currentRound === 2
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted border-border',
              !round1Completed && 'opacity-50 cursor-not-allowed',
            )}
          >
            {!round1Completed && <Lock className="inline h-3.5 w-3.5 mr-1" />}
            2회독
          </button>
        </div>
      )}

      {round2Locked ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Lock className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">
            1회독을 먼저 완료해야 2회독을 시작할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          {/* Dialogue selector */}
          {dialogues.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dialogues.map((d, idx) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    idx === currentIndex
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-muted border-border'
                  }`}
                >
                  {d.title}
                </button>
              ))}
            </div>
          )}

          {/* Chunk progress indicator */}
          {showChunkInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="shrink-0">
                묶음 {chunkProgress[activeTab].idx + 1}/{totalChunks}
              </span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(chunkProgress[activeTab].idx / totalChunks) * 100}%` }}
                />
              </div>
              <span className="shrink-0 text-xs">
                전체 {allSentences.length}문장
              </span>
            </div>
          )}

          {/* 3-tab exercise layout */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DialogueExerciseType)}>
            <TabsList className="w-full">
              <TabsTrigger value="ordering" className="flex-1">
                순서 배열{showChunkInfo ? ` (${orderingIdx + 1}/${totalChunks})` : ''}
              </TabsTrigger>
              <TabsTrigger value="first_letter" className="flex-1">
                첫 글자{showChunkInfo ? ` (${firstLetterIdx + 1}/${totalChunks})` : ''}
              </TabsTrigger>
              <TabsTrigger value="translation" className="flex-1">
                영작{showChunkInfo ? ` (${translationIdx + 1}/${totalChunks})` : ''}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ordering">
              <DialogueLineOrdering
                key={`ordering-${dialogue.id}-r${currentRound}-c${orderingIdx}`}
                sentences={chunks[orderingIdx]}
                onComplete={(score, wrongs) => {
                  handleExerciseComplete('ordering', wrongs ?? []);
                }}
              />
              <NextChunkButton type="ordering" />
            </TabsContent>

            <TabsContent value="first_letter">
              <FirstLetterExercise
                key={`fl-${dialogue.id}-r${currentRound}-c${firstLetterIdx}`}
                sentences={chunks[firstLetterIdx]}
                onComplete={(score, wrongs) => {
                  handleExerciseComplete('first_letter', wrongs ?? []);
                }}
              />
              <NextChunkButton type="first_letter" />
            </TabsContent>

            <TabsContent value="translation">
              <TranslationExercise
                key={`tr-${dialogue.id}-r${currentRound}-c${translationIdx}`}
                passage={dialogueToChunkPassage(dialogue, chunks[translationIdx])}
                onComplete={(_score, wrongs) => {
                  // Wrongs already saved via onPageWrongs
                  handleExerciseComplete('translation', wrongs ?? [], true);
                }}
                onPageWrongs={(wrongs) => {
                  if (wrongs.length > 0) saveWrongAnswers(wrongs, 'translation');
                }}
                showWrongAlert
              />
              <NextChunkButton type="translation" />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
