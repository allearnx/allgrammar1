import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { gradeTranslationBatchSchema } from '@/lib/api/schemas';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Rate limit: per user, per hour (counts per submission, not per sentence)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export const POST = createApiHandler(
  { schema: gradeTranslationBatchSchema },
  async ({ user, body }) => {
    const { sentences } = body;

    // Rate limiting (1 count per batch submission)
    const now = Date.now();
    const userLimit = rateLimitMap.get(user.id);
    if (userLimit) {
      if (now < userLimit.resetAt) {
        if (userLimit.count >= RATE_LIMIT) {
          return NextResponse.json(
            { error: '시간당 채점 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(user.id, { count: 1, resetAt: now + RATE_WINDOW_MS });
      }
    } else {
      rateLimitMap.set(user.id, { count: 1, resetAt: now + RATE_WINDOW_MS });
    }

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
      console.error('AI batch grading error:', error);
      return NextResponse.json(
        { error: 'AI 채점 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
);
