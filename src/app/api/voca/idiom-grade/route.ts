import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const schema = z.object({
  questions: z.array(z.object({
    type: z.enum(['idiom_en_to_ko', 'idiom_ko_to_en', 'idiom_example_translate', 'idiom_writing']),
    prompt: z.string(),
    reference: z.string(),
    studentAnswer: z.string(),
  })).min(1).max(30),
});

export const POST = createApiHandler(
  { schema },
  async ({ user, body }) => {
    const { questions } = body;

    const limited = checkRateLimit(user.id, 'voca/idiom-grade', 20);
    if (limited) return limited;

    // 1) Exact match fast path
    type ResultItem = { score: number; feedback: string };
    const results: (ResultItem | null)[] = questions.map((q) => {
      const trimmed = q.studentAnswer.trim().toLowerCase();
      const ref = q.reference.trim().toLowerCase();
      if (trimmed === ref) {
        return { score: 100, feedback: '정답!' };
      }
      return null;
    });

    const needsAI = results
      .map((r, i) => (r === null ? i : -1))
      .filter((i) => i >= 0);

    if (needsAI.length === 0) {
      return NextResponse.json({ results: results as ResultItem[] });
    }

    // 2) AI grading
    try {
      const aiQuestions = needsAI.map((i) => {
        const q = questions[i];
        const typeLabel = {
          idiom_en_to_ko: '숙어 영→한 해석',
          idiom_ko_to_en: '숙어 한→영 작문',
          idiom_example_translate: '숙어 예문 해석',
          idiom_writing: '숙어 영작',
        }[q.type];
        return `[${i + 1}] (${typeLabel})\nPrompt: "${q.prompt}"\nReference: "${q.reference}"\nStudent: "${q.studentAnswer}"`;
      }).join('\n\n');

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are grading a Korean middle school student's English idiom exercises.

Grade each answer. Scoring rules:
- Meaning match is primary (exact wording not required for translations)
- For 영→한: Korean meaning must convey the same idea as the English idiom
- For 한→영: English must use the correct idiom or very close alternative
- For 예문 해석: Korean translation must capture the sentence meaning
- For 영작: English sentence must correctly use the idiom with proper grammar
- Score: 100 (correct/acceptable), 50 (partially correct), 0 (incorrect)
- Feedback: brief Korean, max 20 chars

${aiQuestions}

Return a JSON array with exactly ${needsAI.length} objects:
[
  { "index": <number>, "score": <100|50|0>, "feedback": "<Korean feedback>" }
]

Return ONLY the JSON array.`,
        }],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const aiResults: { index: number; score: number; feedback: string }[] = JSON.parse(jsonMatch[0]);

        aiResults.forEach((ai, arrIdx) => {
          const originalIdx = needsAI[arrIdx];
          results[originalIdx] = {
            score: ai.score,
            feedback: ai.feedback || (ai.score >= 80 ? '정답!' : '오답'),
          };
        });
      }

      // Fill remaining nulls
      for (let i = 0; i < results.length; i++) {
        if (results[i] === null) {
          results[i] = { score: 0, feedback: '채점 오류 — 다시 시도해주세요' };
        }
      }

      return NextResponse.json({ results: results as ResultItem[] });
    } catch (error) {
      logger.error('ai.grading', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'AI 채점 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
);
