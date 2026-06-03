/**
 * Progress scoring helpers — shared by naesin vocab + ollkill voca APIs.
 * Extracted as pure functions for testability.
 */

const VOCAB_PASS_THRESHOLD = 80;

/** Keep the higher of new score vs existing best. */
export function keepBestScore(newScore: number, existingBest: number | null | undefined): number {
  return Math.max(newScore, existingBest ?? 0);
}

/**
 * Vocab is completed when BOTH quiz and spelling reach the threshold.
 * Uses the *current* score being submitted for the active type,
 * and the *existing best* for the other type.
 */
export function isVocabCompleted(quizScore: number, spellingScore: number): boolean {
  return quizScore >= VOCAB_PASS_THRESHOLD && spellingScore >= VOCAB_PASS_THRESHOLD;
}

/**
 * Build the score updates for a naesin vocab progress save.
 * Returns the fields to upsert and whether vocab is now completed.
 */
export function buildVocabProgressUpdates(
  type: 'flashcard' | 'quiz' | 'spelling',
  score: number,
  totalItems: number | undefined,
  existing: { vocab_flashcard_count?: number; vocab_quiz_score?: number; vocab_spelling_score?: number } | null,
): { updates: Record<string, unknown>; vocabCompleted: boolean } {
  const updates: Record<string, unknown> = {};

  if (type === 'flashcard') {
    updates.vocab_flashcard_count = totalItems || (existing?.vocab_flashcard_count ?? 0);
  } else if (type === 'quiz') {
    updates.vocab_quiz_score = keepBestScore(score, existing?.vocab_quiz_score);
  } else if (type === 'spelling') {
    updates.vocab_spelling_score = keepBestScore(score, existing?.vocab_spelling_score);
  }

  const quizScore = type === 'quiz' ? Math.max(score, existing?.vocab_quiz_score ?? 0) : (existing?.vocab_quiz_score ?? 0);
  const spellingScore = type === 'spelling' ? Math.max(score, existing?.vocab_spelling_score ?? 0) : (existing?.vocab_spelling_score ?? 0);
  const vocabCompleted = isVocabCompleted(quizScore, spellingScore);
  updates.vocab_completed = vocabCompleted;

  return { updates, vocabCompleted };
}

/**
 * Build the score updates for an ollkill voca progress save.
 * Returns the fields to upsert.
 */
export function buildVocaQuizUpdate(
  score: number,
  isRound2: boolean,
  existing: Record<string, unknown> | null,
): Record<string, unknown> {
  const col = isRound2 ? 'round2_quiz_score' : 'quiz_score';
  return { [col]: keepBestScore(score, (existing?.[col] as number) ?? 0) };
}

export function buildVocaSpellingUpdate(
  score: number,
  existing: Record<string, unknown> | null,
): Record<string, unknown> {
  return { spelling_score: keepBestScore(score, (existing?.spelling_score as number) ?? 0) };
}
