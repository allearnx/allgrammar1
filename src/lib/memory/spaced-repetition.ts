import { addDays, format } from 'date-fns';

// Ebbinghaus intervals: 1 → 2 → 7 → 30 days
const INTERVALS = [1, 2, 7, 30];

export interface RepetitionResult {
  nextIntervalDays: number;
  nextReviewDate: string;
  newRepetitionCount: number;
  isMastered: boolean;
}

/**
 * Calculate next review based on correct/wrong answer.
 * - Correct: advance to next interval
 * - Wrong: reset to 1 day
 * - After completing all intervals: mark as mastered
 */
export function calculateNextReview(
  currentRepetitionCount: number,
  isCorrect: boolean
): RepetitionResult {
  if (!isCorrect) {
    // Wrong answer: reset to first interval
    return {
      nextIntervalDays: INTERVALS[0],
      nextReviewDate: format(addDays(new Date(), INTERVALS[0]), 'yyyy-MM-dd'),
      newRepetitionCount: 0,
      isMastered: false,
    };
  }

  // Correct answer: advance
  const nextCount = currentRepetitionCount + 1;

  if (nextCount >= INTERVALS.length) {
    // All intervals completed: mastered
    return {
      nextIntervalDays: INTERVALS[INTERVALS.length - 1],
      nextReviewDate: format(addDays(new Date(), INTERVALS[INTERVALS.length - 1]), 'yyyy-MM-dd'),
      newRepetitionCount: nextCount,
      isMastered: true,
    };
  }

  const nextInterval = INTERVALS[nextCount];
  return {
    nextIntervalDays: nextInterval,
    nextReviewDate: format(addDays(new Date(), nextInterval), 'yyyy-MM-dd'),
    newRepetitionCount: nextCount,
    isMastered: false,
  };
}

/**
 * Check if an item is due for review
 */
export function isDueForReview(nextReviewDate: string): boolean {
  const today = format(new Date(), 'yyyy-MM-dd');
  return nextReviewDate <= today;
}
