'use client';

import { ProblemTab } from '@/components/naesin/problem-tab';
import type { NaesinProblemSheet } from '@/types/database';

interface LastAttempt {
  score: number;
  total_questions: number;
  wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
  created_at: string;
}

interface ExamClientProps {
  sheet: NaesinProblemSheet;
  bestScore: number | null;
  lastAttempt: LastAttempt | null;
}

export function ExamClient({ sheet, bestScore, lastAttempt }: ExamClientProps) {
  const bestScoreBySheet = bestScore != null ? { [sheet.id]: bestScore } : {};
  const lastAttemptBySheet = lastAttempt ? { [sheet.id]: lastAttempt } : {};

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold">{sheet.title}</h2>
      <ProblemTab
        sheets={[sheet]}
        unitId={sheet.unit_id || null}
        bestScoreBySheet={bestScoreBySheet}
        lastAttemptBySheet={lastAttemptBySheet}
      />
    </div>
  );
}
