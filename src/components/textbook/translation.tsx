'use client';

import { useSaveProgress } from '@/hooks/use-save-progress';
import { TranslationExercise } from '@/components/shared/translation-exercise';
import type { TextbookPassage, StudentTextbookProgress } from '@/types/database';

interface TranslationViewProps {
  passage: TextbookPassage;
  progress?: StudentTextbookProgress | null;
}

export function TranslationView({ passage }: TranslationViewProps) {
  const { saveTextbookProgress } = useSaveProgress();

  return (
    <TranslationExercise
      passage={passage}
      onComplete={(score) => {
        saveTextbookProgress(passage.id, 'translation', score);
      }}
      rateLimitText="AI 채점 (시간당 10회 제한)"
    />
  );
}
