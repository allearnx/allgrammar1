'use client';

import { FillBlanksExercise } from '@/components/shared/fill-blanks-exercise';
import type { TextbookPassage } from '@/types/database';

export function NaesinFillBlanksView({
  passage,
  onScoreChange,
}: {
  passage: TextbookPassage;
  onScoreChange: (score: number, wrongAnswers?: unknown[]) => void;
}) {
  return (
    <FillBlanksExercise
      passage={passage}
      onComplete={(score, wrongs) => onScoreChange(score, wrongs)}
      showWrongAlert
    />
  );
}
