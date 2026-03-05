'use client';

import { useSaveProgress } from '@/hooks/use-save-progress';
import { OrderingExercise } from '@/components/shared/ordering-exercise';
import type { TextbookPassage, StudentTextbookProgress } from '@/types/database';

interface OrderingViewProps {
  passage: TextbookPassage;
  progress?: StudentTextbookProgress | null;
}

export function OrderingView({ passage }: OrderingViewProps) {
  const { saveTextbookProgress } = useSaveProgress();

  return (
    <OrderingExercise
      passage={passage}
      onComplete={(score) => {
        saveTextbookProgress(passage.id, 'ordering', score);
      }}
      sortableGroup="words"
    />
  );
}
