import type Anthropic from '@anthropic-ai/sdk';
import type { NaesinProblemQuestion } from '@/types/naesin';
import {
  validateProblemStructure,
  type StructuralValidationResult,
} from './problem-validator';
import {
  crossCheckAnswers,
  type AnswerCheckBatchResult,
} from './problem-answer-check';
import {
  scoreQuality,
  type QualityBatchResult,
} from './problem-quality-score';

// ── Types ──

export type ValidationBadge = 'pass' | 'warn' | 'fail';

export interface FullValidationResult {
  structural: StructuralValidationResult;
  answerCheck?: AnswerCheckBatchResult;
  qualityScore?: QualityBatchResult;
  badge: ValidationBadge;
  summary: string;
}

// ── Badge Logic ──

function computeBadge(result: FullValidationResult): ValidationBadge {
  if (!result.structural.valid) return 'fail';
  if (result.answerCheck && result.answerCheck.mismatchCount > 0) return 'warn';
  if (result.qualityScore && result.qualityScore.averageScore < 50) return 'warn';
  if (result.qualityScore && result.qualityScore.flaggedCount > 0) return 'warn';
  if (result.answerCheck && result.answerCheck.tooObviousCount > 0) return 'warn';
  if (result.structural.warningCount > 0) return 'warn';
  return 'pass';
}

function computeSummary(result: FullValidationResult): string {
  const parts: string[] = [];
  parts.push(`구조: ${result.structural.valid ? '통과' : `오류 ${result.structural.errorCount}건`}`);
  if (result.structural.warningCount > 0) {
    parts.push(`경고 ${result.structural.warningCount}건`);
  }
  if (result.answerCheck) {
    if (result.answerCheck.mismatchCount > 0) {
      parts.push(`정답 불일치 ${result.answerCheck.mismatchCount}건`);
    }
    if (result.answerCheck.tooObviousCount > 0) {
      parts.push(`뻔한 객관식 ${result.answerCheck.tooObviousCount}건`);
    }
  }
  if (result.qualityScore) {
    parts.push(`품질 ${result.qualityScore.averageScore}점`);
    if (result.qualityScore.flaggedCount > 0) {
      parts.push(`플래그 ${result.qualityScore.flaggedCount}건`);
    }
  }
  return parts.join(' / ');
}

// ── Public API ──

export async function runFullValidation(
  questions: NaesinProblemQuestion[],
  anthropic: Anthropic,
  options?: { skipAi?: boolean },
): Promise<FullValidationResult> {
  const structural = validateProblemStructure(questions);

  const result: FullValidationResult = {
    structural,
    badge: 'pass',
    summary: '',
  };

  // If structural errors exist or AI skip requested, don't run AI layers
  if (!structural.valid || options?.skipAi) {
    result.badge = computeBadge(result);
    result.summary = computeSummary(result);
    return result;
  }

  // Layer 2 + 3 in parallel
  const [answerCheck, qualityScore] = await Promise.all([
    crossCheckAnswers(questions, anthropic),
    scoreQuality(questions, anthropic),
  ]);

  result.answerCheck = answerCheck;
  result.qualityScore = qualityScore;
  result.badge = computeBadge(result);
  result.summary = computeSummary(result);

  return result;
}

// Re-export everything
export { validateProblemStructure } from './problem-validator';
export type { StructuralValidationResult, ValidationIssue, IssueSeverity } from './problem-validator';
export { crossCheckAnswers } from './problem-answer-check';
export type { AnswerCheckBatchResult, AnswerCheckResult, AnswerCheckConfidence } from './problem-answer-check';
export { scoreQuality } from './problem-quality-score';
export type { QualityBatchResult, QuestionQualityScore, QualityFlag } from './problem-quality-score';
