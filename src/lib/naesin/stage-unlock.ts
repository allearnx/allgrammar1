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
  /** Stages the student is allowed to access (from naesin_student_settings.enabled_stages) */
  enabledStages?: string[];
}

/**
 * All stages with content are available (no sequential lock).
 * Completed stages stay completed. Stages with no content auto-complete.
 * lastReview unlocks D-3 before exam (progress-independent).
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
  let enabledStages: string[] | null = null;

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
    enabledStages = input.enabledStages ?? null;
  } else {
    progress = progressOrInput as NaesinStudentProgress | null;
    content = { hasVocab: false, hasPassage: false, hasDialogue: false, hasGrammar: false, hasProblem: false, hasLastReview: false };
  }

  // Stage 1: Vocab
  const vocabStatus = getVocabStatus(progress, content.hasVocab, vocabQuizSetCount);

  // Stage 2: Passage
  const passageStatus = getPassageStatus(progress, content.hasPassage);

  // Stage 3: Dialogue
  const dialogueStatus = getDialogueStatus(progress, content.hasDialogue);

  // Stage 4: Grammar
  const grammarStatus = getGrammarStatus(progress, content.hasGrammar, grammarVideoCount);

  // Stage 5: Problem
  const problemStatus = getProblemStatus(progress, content.hasProblem);

  // Stage 6: Last Review — D-3 auto-unlock (progress-independent)
  const lastReviewStatus = getLastReviewStatus(content.hasLastReview, examDate);

  let result: NaesinStageStatuses = {
    vocab: vocabStatus,
    passage: passageStatus,
    dialogue: dialogueStatus,
    grammar: grammarStatus,
    problem: problemStatus,
    lastReview: lastReviewStatus,
  };

  // Override disabled stages to 'hidden'
  if (enabledStages) {
    const stageKeys = ['vocab', 'passage', 'dialogue', 'grammar', 'problem', 'lastReview'] as const;
    for (const key of stageKeys) {
      if (!enabledStages.includes(key)) {
        result[key] = 'hidden';
      }
    }
  }

  return result;
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
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.passage_completed) return 'completed';
  return 'available';
}

function getDialogueStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.dialogue_completed) return 'completed';
  return 'available';
}

function getGrammarStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
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

  return 'available';
}

function getProblemStatus(
  progress: NaesinStudentProgress | null,
  hasContent: boolean,
): NaesinStageStatus {
  if (!hasContent) return 'completed';
  if (progress?.problem_completed) return 'completed';
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
