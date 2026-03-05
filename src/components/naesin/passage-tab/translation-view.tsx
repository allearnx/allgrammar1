'use client';

import { TranslationExercise } from '@/components/shared/translation-exercise';
import type { TextbookPassage } from '@/types/database';

export function NaesinTranslationView({
  passage,
  onScoreChange,
}: {
  passage: TextbookPassage;
  onScoreChange: (score: number, wrongAnswers?: unknown[]) => void;
}) {
  return (
    <TranslationExercise
      passage={passage}
      onComplete={(score, wrongs) => onScoreChange(score, wrongs)}
      showWrongAlert
    />
  );
}
