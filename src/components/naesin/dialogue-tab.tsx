'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { TranslationExercise } from '@/components/shared/translation-exercise';
import type { NaesinDialogue } from '@/types/naesin';
import type { TextbookPassage } from '@/types/database';

interface DialogueTabProps {
  dialogues: NaesinDialogue[];
  unitId: string;
  onStageComplete: () => void;
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

export function DialogueTab({ dialogues, unitId, onStageComplete }: DialogueTabProps) {
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
      const res = await fetch('/api/naesin/dialogue/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, score }),
      });
      const data = await res.json();
      if (data.dialogueCompleted) {
        toast.success('대화문 암기 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch (err) {
      logger.error('naesin.dialogue_tab', { error: err instanceof Error ? err.message : String(err) });
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  return (
    <div className="space-y-4">
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
        key={dialogue.id}
        passage={passage}
        onComplete={(score) => saveDialogueProgress(score)}
        showWrongAlert
      />
    </div>
  );
}
