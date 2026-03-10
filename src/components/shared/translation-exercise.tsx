'use client';

import type { TextbookPassage } from '@/types/database';
import { SentenceBysentenceTranslation } from './sentence-translation';
import { WholePassageTranslation } from './passage-translation';

// ── 타입 (re-export for sub-components) ──

export interface SentenceData {
  original: string;
  korean: string;
  acceptedAnswers?: string[];
}

export interface GradingResult {
  score: number;
  feedback: string;
  correctedSentence: string;
}

export interface WrongTranslation {
  type: 'translation';
  koreanText: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

export interface TranslationExerciseProps {
  passage: TextbookPassage;
  onComplete: (score: number, wrongAnswers: WrongTranslation[]) => void;
  showWrongAlert?: boolean;
  rateLimitText?: string;
  sentencesPerPage?: number;
}

// ── 메인 컴포넌트 ──

export function TranslationExercise({ passage, onComplete, showWrongAlert, sentencesPerPage = 10 }: TranslationExerciseProps) {
  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;

  if (hasSentences) {
    return (
      <SentenceBysentenceTranslation
        passage={passage}
        onComplete={onComplete}
        showWrongAlert={showWrongAlert}
        sentencesPerPage={sentencesPerPage}
      />
    );
  }

  return (
    <WholePassageTranslation
      passage={passage}
      onComplete={onComplete}
      showWrongAlert={showWrongAlert}
    />
  );
}
