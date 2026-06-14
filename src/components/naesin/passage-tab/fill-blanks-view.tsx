'use client';

import { FillBlanksExercise } from '@/components/shared/fill-blanks-exercise';
import type { TextbookPassage } from '@/types/database';

export function NaesinFillBlanksView({
  passage,
  onScoreChange,
  onNextStage,
  nextStageLabel,
}: {
  passage: TextbookPassage;
  onScoreChange: (score: number, wrongAnswers?: unknown[], difficulty?: string) => void;
  onNextStage?: () => void;
  nextStageLabel?: string;
}) {
  return (
    <FillBlanksExercise
      passage={passage}
      onComplete={(score, wrongs, difficulty) => onScoreChange(score, wrongs, difficulty)}
      showWrongAlert
      onNext={onNextStage}
      nextLabel={nextStageLabel}
    />
  );
}
