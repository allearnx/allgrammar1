import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import { gradeTranslationBatchSchema } from '@/lib/api/schemas';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export const POST = createApiHandler(
  { schema: gradeTranslationBatchSchema },
  async ({ user, body }) => {
    const { sentences } = body;

    const limited = checkRateLimit(user.id, 'textbook/grade-translation-batch', 20);
    if (limited) return limited;

    try {
      const sentenceList = sentences
        .map((s: { koreanText: string; originalText: string; studentAnswer: string }, i: number) =>
          `[${i + 1}]\nKorean: "${s.koreanText}"\nReference: "${s.originalText}"\nStudent: "${s.studentAnswer}"`
        )
        .join('\n\n');

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `You are an English teacher grading a Korean middle school student's English translations.

Grade each sentence below. Respond with a JSON array only (no other text):

${sentenceList}

Return format - a JSON array with exactly ${sentences.length} objects:
[
  { "score": <0-100>, "feedback": "<brief Korean feedback>", "correctedSentence": "<correct English>" },
  ...
]

Grading criteria per sentence:
- Grammar accuracy (40%)
- Meaning accuracy (40%)
- Natural expression (20%)
- Be encouraging but honest. Minor spelling errors should lose fewer points.`,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const results = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ results });
    } catch (error) {
      logger.error('ai.grading', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'AI 채점 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
);
