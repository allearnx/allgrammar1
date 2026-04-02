import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { problemValidateSchema } from '@/lib/api/schemas';
import { runFullValidation } from '@/lib/validation';
import Anthropic from '@anthropic-ai/sdk';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 60;

const anthropic = new Anthropic();

export const POST = createApiHandler(
  {
    roles: ['teacher', 'admin', 'boss'],
    schema: problemValidateSchema,
    rateLimit: { max: 50 },
  },
  async ({ body }) => {
    const { questions, skipAi } = body;

    const result = await runFullValidation(
      questions as NaesinProblemQuestion[],
      anthropic,
      { skipAi: skipAi ?? undefined },
    );

    return NextResponse.json(result);
  },
);
