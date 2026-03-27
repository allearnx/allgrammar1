import { z } from 'zod';

// 서버 환경변수 (빌드/런타임 시 검증)
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY가 설정되지 않았습니다'),

  // 선택 (없어도 앱 구동 가능)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Upstash Redis (없으면 인메모리 폴백)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // 토스페이먼츠 (없으면 결제 기능 비활성)
  TOSS_PAYMENTS_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY: z.string().min(1).optional(),

  // Cron 인증
  CRON_SECRET: z.string().min(1).optional(),

  // 텔레그램 알림 (없으면 알림 비활성)
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_CHAT_ID: z.string().min(1).optional(),
});

// 클라이언트 환경변수 (NEXT_PUBLIC_ 만)
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY: z.string().optional(),
});

function validateEnv() {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    console.error(`\n❌ 환경변수 오류:\n${missing.join('\n')}\n`);
    throw new Error('필수 환경변수가 누락되었습니다.');
  }
  return result.data;
}

// 서버에서만 호출 — Proxy로 감싸 런타임에 최초 접근 시점에 검증 (빌드 시점에는 실행 안 됨)
function createLazyEnv() {
  let validated: ReturnType<typeof validateEnv> | null = null;
  return new Proxy({} as ReturnType<typeof validateEnv>, {
    get(_, prop: string) {
      if (!validated) validated = validateEnv();
      return validated[prop as keyof ReturnType<typeof validateEnv>];
    },
  });
}

export const env = typeof window === 'undefined' ? createLazyEnv() : ({} as ReturnType<typeof validateEnv>);

// 클라이언트에서 안전하게 사용
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY,
});
