import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaDiagnosticQuestionsSchema } from '@/lib/api/schemas/voca';
import { nextRoundQuestions } from '@/lib/voca/diagnostic-flow';
import type { z } from 'zod';

type Body = z.infer<typeof vocaDiagnosticQuestionsSchema>;

// 라운드마다 호출되는 배치성 라우트 → 분당 시간창 명시 (기본값은 시간당)
// 스테어케이스·채점 근거는 전부 서버(봉인 토큰) — 클라이언트는 밴드를 지정할 수 없다.
export const POST = createApiHandler<Body>(
  {
    roles: ['student'],
    schema: vocaDiagnosticQuestionsSchema,
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async ({ body, supabase }) => {
    const result = await nextRoundQuestions(supabase, body);
    if (result.kind === 'error') {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }
    if (result.kind === 'done') return NextResponse.json({ done: true });
    return NextResponse.json({ band: result.band, questions: result.questions });
  },
);
