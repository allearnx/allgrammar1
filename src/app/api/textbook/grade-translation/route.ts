import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Simple in-memory rate limit (per user, per hour)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Simple cache for identical requests
const responseCache = new Map<string, { result: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const now = Date.now();
  const userLimit = rateLimitMap.get(user.id);
  if (userLimit) {
    if (now < userLimit.resetAt) {
      if (userLimit.count >= RATE_LIMIT) {
        return NextResponse.json(
          { error: '시간당 채점 횟수(10회)를 초과했습니다. 잠시 후 다시 시도해주세요.' },
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

  const { koreanText, originalText, studentAnswer } = await request.json();

  if (!koreanText || !originalText || !studentAnswer) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Check cache
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

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Cache the result
    responseCache.set(cacheKey, {
      result,
      expiresAt: now + CACHE_TTL_MS,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI grading error:', error);
    return NextResponse.json(
      { error: 'AI 채점 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
