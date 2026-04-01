import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { NaesinStageStatuses, NaesinStudentProgress } from '@/types/database';

export interface UnitSummary {
  id: string;
  unit_number: number;
  title: string;
  sort_order: number;
  stageStatuses: NaesinStageStatuses;
  stageProgress: { vocab: number; passage: number; grammar: number; problem: number };
}

export interface ExamGroup {
  round: number;
  label: string;
  examDate: string | null;
  units: UnitSummary[];
}

export interface BuildContext {
  vocabUnitIds: Set<string>;
  passageUnitIds: Set<string>;
  dialogueUnitIds: Set<string>;
  grammarByUnit: Record<string, { content_type: string }[]>;
  problemUnitIds: Set<string>;
  lastReviewSheetUnitIds: Set<string>;
  similarProblemUnitIds: Set<string>;
  reviewContentUnitIds: Set<string>;
  progressMap: Map<string, NaesinStudentProgress>;
  quizSetsByUnit: Record<string, unknown[]>;
  examDate: string | null;
  enabledStages: string[];
  naesinRequiredRounds?: number;
}

export function groupBy<T extends Record<string, unknown>>(items: T[], key: string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = item[key] as string;
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

export function computeStageProgress(
  progress: NaesinStudentProgress | null,
  quizSetCount: number,
  videoCount: number
): { vocab: number; passage: number; grammar: number; problem: number } {
  if (!progress) return { vocab: 0, passage: 0, grammar: 0, problem: 0 };

  // Vocab: average of quiz + spelling scores (or 100 if completed)
  let vocab = 0;
  if (progress.vocab_completed) {
    vocab = 100;
  } else {
    const q = progress.vocab_quiz_score ?? 0;
    const s = progress.vocab_spelling_score ?? 0;
    vocab = quizSetCount > 0 ? Math.round((q + s) / 2) : 0;
  }

  // Passage: average of fill_blanks + translation scores
  let passage = 0;
  if (progress.passage_completed) {
    passage = 100;
  } else {
    const fb = progress.passage_fill_blanks_best ?? 0;
    const tr = progress.passage_translation_best ?? 0;
    passage = Math.round((fb + tr) / 2);
  }

  // Grammar: videos completed / total
  let grammar = 0;
  if (progress.grammar_completed) {
    grammar = 100;
  } else if (videoCount > 0) {
    grammar = Math.round((progress.grammar_videos_completed / videoCount) * 100);
  }

  // Problem: 0 or 100
  const problem = progress.problem_completed ? 100 : 0;

  return { vocab, passage, grammar, problem };
}

interface RawUnit {
  id: string;
  unit_number: number;
  title: string;
  sort_order: number;
}

export function buildUnitSummary(
  u: RawUnit,
  ctx: BuildContext,
  overrideExamDate?: string | null,
): UnitSummary {
  const unitProgress = ctx.progressMap.get(u.id) || null;
  const unitGrammar = ctx.grammarByUnit[u.id] || [];
  const videoLessons = unitGrammar.filter((l) => l.content_type === 'video');
  const unitQuizSets = ctx.quizSetsByUnit[u.id] || [];
  const effectiveExamDate = overrideExamDate !== undefined ? overrideExamDate : ctx.examDate;

  const hasLastReviewContent =
    ctx.lastReviewSheetUnitIds.has(u.id) ||
    ctx.similarProblemUnitIds.has(u.id) ||
    ctx.reviewContentUnitIds.has(u.id);

  const stageStatuses = calculateStageStatuses({
    progress: unitProgress,
    content: {
      hasVocab: ctx.vocabUnitIds.has(u.id),
      hasPassage: ctx.passageUnitIds.has(u.id),
      hasDialogue: ctx.dialogueUnitIds.has(u.id),
      hasGrammar: unitGrammar.length > 0,
      hasProblem: ctx.problemUnitIds.has(u.id),
      hasLastReview: hasLastReviewContent || !!effectiveExamDate,
    },
    vocabQuizSetCount: unitQuizSets.length,
    grammarVideoCount: videoLessons.length,
    examDate: effectiveExamDate,
    enabledStages: ctx.enabledStages,
    naesinRequiredRounds: ctx.naesinRequiredRounds,
  });

  const stageProgress = computeStageProgress(unitProgress, unitQuizSets.length, videoLessons.length);

  return {
    id: u.id,
    unit_number: u.unit_number,
    title: u.title,
    sort_order: u.sort_order,
    stageStatuses,
    stageProgress,
  };
}
