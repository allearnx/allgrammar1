import type Anthropic from '@anthropic-ai/sdk';
import type { NaesinProblemQuestion } from '@/types/naesin';
import { parseAiJsonArray } from '@/lib/ai-json';
import { gradeAnswerLCS } from '@/lib/utils/lcs-grader';
import { logger } from '@/lib/logger';

// ── Types ──

export type AnswerCheckConfidence = 'high' | 'medium' | 'low';

export interface AnswerCheckResult {
  questionNumber: number;
  match: boolean;
  aiAnswer: string | number;
  expectedAnswer: string | number;
  confidence: AnswerCheckConfidence;
  tooObvious?: boolean;
  suggestSubjective?: boolean;
  reason?: string;
}

export interface AnswerCheckBatchResult {
  results: AnswerCheckResult[];
  mismatchCount: number;
  tooObviousCount: number;
}

// ── Constants ──

const BATCH_SIZE = 10;
const MODEL = 'claude-haiku-4-5-20251001';
const LCS_MISMATCH_THRESHOLD = 70;

// ── Prompt ──

function buildCheckPrompt(questions: NaesinProblemQuestion[]): string {
  const stripped = questions.map((q) => ({
    number: q.number,
    question: q.question,
    ...(q.options ? { options: q.options } : {}),
  }));

  return `You are a middle school English grammar test-taker. Solve each question below.
For multiple choice: pick the correct option number (1-5).
For open-ended: write the correct answer text.
Also flag if a multiple-choice question is "too obvious" (only one option is grammatically valid, making it trivially solvable by elimination).

Questions:
${JSON.stringify(stripped, null, 2)}

Respond ONLY with a JSON array:
[
  { "number": 1, "answer": "3", "confidence": "high", "too_obvious": false, "reason": "brief explanation" },
  ...
]

confidence: "high" if certain, "medium" if unsure between 2, "low" if guessing.
too_obvious: true if only one option is grammatically correct (no real distraction).`;
}

// ── Core ──

async function checkBatch(
  questions: NaesinProblemQuestion[],
  anthropic: Anthropic,
): Promise<AnswerCheckResult[]> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildCheckPrompt(questions) }],
  });

  const aiResults = parseAiJsonArray<{
    number: number;
    answer: string | number;
    confidence?: string;
    too_obvious?: boolean;
    reason?: string;
  }>(message);

  const results: AnswerCheckResult[] = [];

  for (const q of questions) {
    const aiResult = aiResults.find((r) => r.number === q.number);
    if (!aiResult) {
      results.push({
        questionNumber: q.number,
        match: false,
        aiAnswer: '(no response)',
        expectedAnswer: q.answer,
        confidence: 'low',
        reason: 'AI가 이 문제에 응답하지 않음',
      });
      continue;
    }

    const isMcq = Array.isArray(q.options) && q.options.length > 0;
    let match: boolean;

    if (isMcq) {
      // Compare numeric answer
      match = String(aiResult.answer).trim() === String(q.answer).trim();
    } else {
      // Subjective: LCS similarity ≥ threshold
      const score = gradeAnswerLCS(String(q.answer), String(aiResult.answer));
      match = score >= LCS_MISMATCH_THRESHOLD;
    }

    const confidence = (aiResult.confidence === 'high' || aiResult.confidence === 'medium' || aiResult.confidence === 'low')
      ? aiResult.confidence
      : 'medium';

    results.push({
      questionNumber: q.number,
      match,
      aiAnswer: aiResult.answer,
      expectedAnswer: q.answer,
      confidence,
      tooObvious: isMcq ? (aiResult.too_obvious ?? false) : undefined,
      suggestSubjective: isMcq && aiResult.too_obvious ? true : undefined,
      reason: aiResult.reason,
    });
  }

  return results;
}

// ── Public API ──

export async function crossCheckAnswers(
  questions: NaesinProblemQuestion[],
  anthropic: Anthropic,
): Promise<AnswerCheckBatchResult> {
  const allResults: AnswerCheckResult[] = [];

  // Process in batches
  const batches: NaesinProblemQuestion[][] = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE));
  }

  const batchPromises = batches.map((batch) =>
    checkBatch(batch, anthropic).catch((err) => {
      logger.error('validation.answer_check_batch', { error: err instanceof Error ? err.message : String(err) });
      return [] as AnswerCheckResult[];
    }),
  );

  const batchResults = await Promise.all(batchPromises);
  for (const results of batchResults) {
    allResults.push(...results);
  }

  return {
    results: allResults,
    mismatchCount: allResults.filter((r) => !r.match).length,
    tooObviousCount: allResults.filter((r) => r.tooObvious).length,
  };
}
