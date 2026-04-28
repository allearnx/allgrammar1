import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';

export const maxDuration = 60;

const anthropic = new Anthropic();

const schema = z.object({
  sentences: z.array(z.object({
    id: z.string(),
    sentence: z.string().min(1),
  })).min(1).max(200),
});

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema, rateLimit: { max: 10 } },
  async ({ body }) => {
    const { sentences } = body as z.infer<typeof schema>;

    const list = sentences.map((s) => `- id: ${s.id} | ${s.sentence}`).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `다음 영어 문장들을 자연스러운 한국어로 번역해주세요.

${list}

JSON 배열로만 응답 (다른 텍스트 없이):
[{"id":"원본id","ko":"한국어 번역"}]`,
      }],
    });

    const results = requireAiJsonArray<{ id: string; ko: string }>(message, 'ai.translate_sentences');
    return NextResponse.json({ translations: results });
  },
);
