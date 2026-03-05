'use client';

import { OrderingExercise } from '@/components/shared/ordering-exercise';
import type { TextbookPassage } from '@/types/database';

export function NaesinOrderingView({ passage, onScoreChange }: { passage: TextbookPassage; onScoreChange: (score: number) => void }) {
  return (
    <OrderingExercise
      passage={passage}
      onComplete={onScoreChange}
      sortableGroup="naesin-words"
    />
  );
}
