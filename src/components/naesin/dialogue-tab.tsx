'use client';

import { useState } from 'react';
import { MessageSquare, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { cn } from '@/lib/utils';
import { TranslationExercise } from '@/components/shared/translation-exercise';
import type { NaesinDialogue } from '@/types/naesin';
import type { TextbookPassage } from '@/types/database';

interface DialogueTabProps {
  dialogues: NaesinDialogue[];
  unitId: string;
  onStageComplete: () => void;
  naesinRequiredRounds?: number;
  round1Completed?: boolean;
}

function dialogueToTextbookPassage(dialogue: NaesinDialogue): TextbookPassage {
  const sentences = dialogue.sentences.map((s) => ({
    original: s.original,
    korean: s.speaker ? `[${s.speaker}] ${s.korean}` : s.korean,
    words: s.original.split(/\s+/).filter(Boolean),
  }));

  return {
    id: dialogue.id,
    grammar_id: '',
    title: dialogue.title,
    original_text: dialogue.sentences.map((s) => s.original).join(' '),
    korean_translation: dialogue.sentences.map((s) => s.korean).join(' '),
    blanks_easy: null,
    blanks_medium: null,
    blanks_hard: null,
    sentences,
    is_textbook_mode_active: true,
    created_at: dialogue.created_at,
  };
}

export function DialogueTab({ dialogues, unitId, onStageComplete, naesinRequiredRounds, round1Completed }: DialogueTabProps) {
  const hasRound2 = (naesinRequiredRounds ?? 1) >= 2;
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (dialogues.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          등록된 대화문이 없습니다.
        </p>
      </div>
    );
  }

  const dialogue = dialogues[currentIndex];
  const passage = dialogueToTextbookPassage(dialogue);

  async function saveDialogueProgress(score: number) {
    try {
      const data = await fetchWithToast<{ dialogueCompleted?: boolean }>('/api/naesin/dialogue/progress', {
        body: { unitId, score, round: String(currentRound) },
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

  const round2Locked = hasRound2 && currentRound === 2 && !round1Completed;

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
                : 'bg-card hover:bg-muted border-border'
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
              !round1Completed && 'opacity-50 cursor-not-allowed'
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

          <TranslationExercise
            key={`${dialogue.id}-r${currentRound}`}
            passage={passage}
            onComplete={(score) => saveDialogueProgress(score)}
            showWrongAlert
          />
        </>
      )}
    </div>
  );
}
