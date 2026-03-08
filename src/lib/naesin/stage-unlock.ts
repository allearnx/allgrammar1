import type {
  NaesinStudentProgress,
  NaesinStageStatus,
  NaesinStageStatuses,
  NaesinContentAvailability,
} from '@/types/database';

export interface StageUnlockInput {
  progress: NaesinStudentProgress | null;
  content: NaesinContentAvailability;
  /** Number of vocab quiz sets created by teacher for this unit */
  vocabQuizSetCount?: number;
  /** Number of grammar video lessons for this unit */
  grammarVideoCount?: number;
  /** Student's exam date (ISO string) */
  examDate?: string | null;
}

/**
 * 5-stage progressive unlock:
 * vocab → passage → grammar → problem → lastReview
 *
 * All thresholds are 80%.
 * lastReview unlocks D-3 before exam (progress-independent).
 * Stages with no content auto-complete.
 */
export function calculateStageStatuses(input: StageUnlockInput): NaesinStageStatuses;
/**
 * @deprecated Legacy 4-arg signature for backward compatibility during migration.
 * Will be removed after Phase 6.
 */
export function calculateStageStatuses(
  progress: NaesinStudentProgress | null,
  content: NaesinContentAvailability
): NaesinStageStatuses;
export function calculateStageStatuses(
  progressOrInput: NaesinStudentProgress | null | StageUnlockInput,
  contentArg?: NaesinContentAvailability
): NaesinStageStatuses {
  let progress: NaesinStudentProgress | null;
  let content: NaesinContentAvailability;
  let vocabQuizSetCount = 0;
  let grammarVideoCount = 0;
  let examDate: string | null = null;

  // Support both old (progress, content) and new (input object) signatures
  if (contentArg !== undefined) {
    progress = progressOrInput as NaesinStudentProgress | null;
    content = contentArg;
  } else if (progressOrInput && 'content' in (progressOrInput as object)) {
    const input = progressOrInput as StageUnlockInput;
    progress = input.progress;
    content = input.content;
    vocabQuizSetCount = input.vocabQuizSetCount ?? 0;
    grammarVideoCount = input.grammarVideoCount ?? 0;
    examDate = input.examDate ?? null;
  } else {
    progress = progressOrInput as NaesinStudentProgress | null;
    content = { hasVocab: false, hasPassage: false, hasGrammar: false, hasProblem: false, hasLastReview: false };
  }

  // Stage 1: Vocab — always available (first stage)
  const vocabStatus = getVocabStatus(progress, content.hasVocab, vocabQuizSetCount);

  // Stage 2: Passage — requires vocab completed
  const passageStatus = getPassageStatus(progress, content.hasPassage, vocabStatus);

  // Stage 3: Grammar — requires passage completed
  const grammarStatus = getGrammarStatus(progress, content.hasGrammar, passageStatus, grammarVideoCount);

  // Stage 4: Problem — requires grammar completed
  const problemStatus = getProblemStatus(progress, content.hasProblem, grammarStatus);

  // Stage 5: Last Review — D-3 auto-unlock (progress-independent)
  const lastReviewStatus = getLastReviewStatus(content.hasLastReview, examDate);

  return {
    vocab: vocabStatus,
    passage: passageStatus,
    grammar: grammarStatus,
    problem: problemStatus,
    lastReview: lastReviewStatus,
  };
}

function getVocabStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
  quizSetCount: number
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.vocab_completed) return 'completed';

  // If quiz sets exist, check if all sets are completed (80%+ each)
  if (quizSetCount > 0 && progress) {
    if (
      progress.vocab_quiz_sets_completed >= quizSetCount &&
      (progress.vocab_quiz_score ?? 0) >= 80 &&
      (progress.vocab_spelling_score ?? 0) >= 80
    ) {
      return 'completed';
    }
  }

  return 'available';
}

function getPassageStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
  prevStatus: NaesinStageStatus
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.passage_completed) return 'completed';
  if (prevStatus !== 'completed') return 'locked';
  return 'available';
}

function getGrammarStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
  prevStatus: NaesinStageStatus,
  videoCount: number
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.grammar_completed) return 'completed';

  // All videos must be 80%+ watched
  if (videoCount > 0 && progress) {
    if (progress.grammar_videos_completed >= videoCount) {
      return 'completed';
    }
  }

  if (prevStatus !== 'completed') return 'locked';
  return 'available';
}

function getProblemStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
  prevStatus: NaesinStageStatus
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.problem_completed) return 'completed';
  if (prevStatus !== 'completed') return 'locked';
  return 'available';
}

function getLastReviewStatus(
  hasContent: boolean,
  examDate: string | null
): NaesinStageStatus {
  if (!hasContent && !examDate) return 'locked';

  // D-3 auto-unlock: if exam date is within 3 days
  if (examDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      return 'available';
    }
  }

  return 'locked';
}
