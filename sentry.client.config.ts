import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
  ],

  // 프로덕션에서 10% 트랜잭션 샘플링
  tracesSampleRate: 0.1,

  // Session Replay: 에러 발생 시 100% 캡처, 일반 세션은 비활성
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // dev 환경에서는 비활성
  enabled: process.env.NODE_ENV === "production",
});
