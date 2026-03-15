'use client';

import { useSaveProgress } from '@/hooks/use-save-progress';
import { FillBlanksExercise } from '@/components/shared/fill-blanks-exercise';
import type { TextbookPassage, StudentTextbookProgress } from '@/types/database';

interface FillBlanksViewProps {
  passage: TextbookPassage;
  progress?: StudentTextbookProgress | null;
}

export function FillBlanksView({ passage }: FillBlanksViewProps) {
  const { saveTextbookProgress } = useSaveProgress();

  return (
    <FillBlanksExercise
      passage={passage}
      onComplete={(score) => {
        saveTextbookProgress(passage.id, 'fill_blanks_easy', score);
      }}
    />
  );
}
