import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import { gradeTranslationSchema } from '@/lib/api/schemas';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Simple cache for identical requests
const responseCache = new Map<string, { result: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const POST = createApiHandler(
  { schema: gradeTranslationSchema, rateLimit: { max: 10 } },
  async ({ user: _user, body }) => {
    const { koreanText, originalText, studentAnswer } = body;

    // Check cache
    const now = Date.now();
    const cacheKey = `${koreanText}::${studentAnswer.trim().toLowerCase()}`;
    const cached = responseCache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      return NextResponse.json(cached.result);
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `You are an English teacher grading a Korean middle school student's English translation.

Korean text to translate:
"${koreanText}"

Reference English translation:
"${originalText}"

Student's answer:
"${studentAnswer}"

Grade the student's translation. Respond in JSON format only:
{
  "score": <0-100 number>,
  "feedback": "<brief feedback in Korean, 2-3 sentences>",
  "correctedSentence": "<the correct/improved English translation>"
}

Grading criteria:
- Grammar accuracy (40%)
- Meaning accuracy (40%)
- Natural expression (20%)
- Be encouraging but honest. Minor spelling errors should lose fewer points.`,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const result = JSON.parse(jsonMatch[0]);

      responseCache.set(cacheKey, {
        result,
        expiresAt: now + CACHE_TTL_MS,
      });

      return NextResponse.json(result);
    } catch (error) {
      logger.error('ai.grading', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'AI 채점 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
);
