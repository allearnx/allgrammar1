import type Anthropic from '@anthropic-ai/sdk';
import type { NaesinProblemQuestion } from '@/types/naesin';
import { parseAiJsonArray } from '@/lib/ai-json';
import { logger } from '@/lib/logger';

// ── Types ──

export type QualityFlag =
  | 'grammar_error'
  | 'too_easy'
  | 'too_hard'
  | 'ambiguous'
  | 'weak_explanation';

export interface QuestionQualityScore {
  questionNumber: number;
  grammarAccuracy: number;   // 0-100
  difficultyFit: number;     // 0-100 (50 = ideal middle school)
  originality: number;       // 0-100
  explanationQuality: number; // 0-100
  overall: number;            // 0-100 weighted average
  flags: QualityFlag[];
}

export interface QualityBatchResult {
  scores: QuestionQualityScore[];
  averageScore: number;
  flaggedCount: number;
}

// ── Constants ──

const BATCH_SIZE = 15;
const MODEL = 'claude-haiku-4-5-20251001';

// ── Prompt ──

function buildQualityPrompt(questions: NaesinProblemQuestion[]): string {
  return `You are an expert English grammar test reviewer for Korean middle school students.
Rate each question on the following rubric (0-100 each):

1. grammar_accuracy: Is the English grammar in the question and answer correct?
2. difficulty_fit: Is the difficulty appropriate for middle school? (50 = perfect fit, <30 = too easy, >70 = too hard)
3. originality: Does the question test the concept in a creative way? (vs. generic template)
4. explanation_quality: Is the explanation clear, accurate, and educational?

Also flag any issues:
- "grammar_error": incorrect English grammar in question/options/answer
- "too_easy": trivially simple for middle school
- "too_hard": beyond middle school level
- "ambiguous": multiple valid answers or unclear wording
- "weak_explanation": explanation is missing, wrong, or unhelpful

Questions:
${JSON.stringify(questions, null, 2)}

Respond ONLY with a JSON array:
[
  {
    "number": 1,
    "grammar_accuracy": 95,
    "difficulty_fit": 50,
    "originality": 70,
    "explanation_quality": 80,
    "flags": []
  },
  ...
]`;
}

// ── Core ──

function computeOverall(s: { grammarAccuracy: number; difficultyFit: number; originality: number; explanationQuality: number }): number {
  // Weight: grammar 40%, difficulty 25%, originality 15%, explanation 20%
  // For difficulty, closer to 50 is better — convert to a 0-100 "fit" score
  const difficultyScore = 100 - Math.abs(s.difficultyFit - 50) * 2;
  return Math.round(
    s.grammarAccuracy * 0.4 +
    Math.max(0, difficultyScore) * 0.25 +
    s.originality * 0.15 +
    s.explanationQuality * 0.2,
  );
}

async function scoreBatch(
  questions: NaesinProblemQuestion[],
  anthropic: Anthropic,
): Promise<QuestionQualityScore[]> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildQualityPrompt(questions) }],
  });

  const aiScores = parseAiJsonArray<{
    number: number;
    grammar_accuracy: number;
    difficulty_fit: number;
    originality: number;
    explanation_quality: number;
    flags?: string[];
  }>(message);

  return questions.map((q) => {
    const ai = aiScores.find((s) => s.number === q.number);
    if (!ai) {
      return {
        questionNumber: q.number,
        grammarAccuracy: 0,
        difficultyFit: 50,
        originality: 0,
        explanationQuality: 0,
        overall: 0,
        flags: [] as QualityFlag[],
      };
    }

    const validFlags: QualityFlag[] = (ai.flags || []).filter(
      (f): f is QualityFlag =>
        ['grammar_error', 'too_easy', 'too_hard', 'ambiguous', 'weak_explanation'].includes(f),
    );

    const score = {
      questionNumber: q.number,
      grammarAccuracy: clamp(ai.grammar_accuracy),
      difficultyFit: clamp(ai.difficulty_fit),
      originality: clamp(ai.originality),
      explanationQuality: clamp(ai.explanation_quality),
      overall: 0,
      flags: validFlags,
    };
    score.overall = computeOverall(score);
    return score;
  });
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v || 0)));
}

// ── Public API ──

export async function scoreQuality(
  questions: NaesinProblemQuestion[],
  anthropic: Anthropic,
): Promise<QualityBatchResult> {
  const allScores: QuestionQualityScore[] = [];

  const batches: NaesinProblemQuestion[][] = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE));
  }

  const batchPromises = batches.map((batch) =>
    scoreBatch(batch, anthropic).catch((err) => {
      logger.error('validation.quality_score_batch', { error: err instanceof Error ? err.message : String(err) });
      return [] as QuestionQualityScore[];
    }),
  );

  const batchResults = await Promise.all(batchPromises);
  for (const scores of batchResults) {
    allScores.push(...scores);
  }

  const averageScore = allScores.length > 0
    ? Math.round(allScores.reduce((sum, s) => sum + s.overall, 0) / allScores.length)
    : 0;

  return {
    scores: allScores,
    averageScore,
    flaggedCount: allScores.filter((s) => s.flags.length > 0).length,
  };
}
