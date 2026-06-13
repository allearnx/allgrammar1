import { NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { parseAiJsonObject } from '@/lib/ai-json';
import { logger } from '@/lib/logger';

export const maxDuration = 120;

const anthropic = new Anthropic();
const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

const schema = z.object({
  questions: z.array(
    z.object({
      number: z.number(),
      question: z.string(),
      options: z.array(z.string()).nullable().optional(),
      answer: z.union([z.string(), z.number()]),
      explanation: z.string().optional(),
    }),
  ),
});

// 빈 해설만 AI로 생성 (검토용으로 반환 — 자동 저장 안 함). teacher/admin/boss + 콘텐츠권한.
export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema, rateLimit: { max: 20 } },
  async ({ user, body, supabase }) => {
    await requireContentPermission(user, supabase);

    // 해설이 비어있는 문항만 대상 (있는 건 안 건드림)
    const targets = body.questions.filter((q) => !q.explanation || q.explanation.trim() === '');
    if (targets.length === 0) return NextResponse.json({ explanations: {} });

    // 너무 많으면 한 번에 40개까지 (토큰 제한)
    const batch = targets.slice(0, 40);
    const list = batch
      .map((q) => {
        const opts = q.options?.length
          ? `\n보기: ${q.options.map((o, i) => `${i + 1}.${o}`).join(' ')}`
          : '';
        return `[${q.number}] ${q.question}${opts}\n정답: ${q.answer}`;
      })
      .join('\n\n');

    const prompt = `다음 중학교 영어 문제들의 해설을 작성하세요.
- 각 문제의 정답이 "왜" 맞는지 한국어로 간결하게 (1~3문장)
- 객관식이면 정답 보기가 맞는 이유 + 필요 시 오답이 틀린 이유
- 근거 없는 추측 금지. 문제/정답에서 확인되는 내용만
- 반드시 JSON 객체로만 응답: { "문제번호": "해설", ... }

${list}`;

    const explanations: Record<string, string> = {};
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = parseAiJsonObject<Record<string, string>>(message);
      if (parsed) {
        // 키를 문항 번호 문자열로 정규화
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string' && v.trim()) explanations[String(k).replace(/[^\d]/g, '')] = v.trim();
        }
      }
    } catch (err) {
      logger.error('problems.generate_explanations', {
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: '해설 생성에 실패했습니다' }, { status: 502 });
    }

    return NextResponse.json({ explanations, generated: Object.keys(explanations).length });
  },
);
