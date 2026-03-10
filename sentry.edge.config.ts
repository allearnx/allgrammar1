import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
  ],

  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === "production",
});
