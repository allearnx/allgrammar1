import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaDiagnosticQuestionsSchema } from '@/lib/api/schemas/voca';
import { sampleDiagnosticQuestions } from '@/lib/voca/diagnostic-sampling';
import type { z } from 'zod';

type Body = z.infer<typeof vocaDiagnosticQuestionsSchema>;

// 라운드마다 호출되는 배치성 라우트 → 분당 시간창 명시 (기본값은 시간당)
export const POST = createApiHandler<Body>(
  {
    roles: ['student'],
    schema: vocaDiagnosticQuestionsSchema,
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async ({ body, supabase }) => {
    const questions = await sampleDiagnosticQuestions(supabase, body.band, body.excludeIds);
    if (!questions) {
      return NextResponse.json(
        { error: '이 레벨의 단어가 아직 준비되지 않았습니다.' },
        { status: 404 },
      );
    }
    return NextResponse.json({ band: body.band, questions });
  },
);
