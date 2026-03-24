import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

// CSP: XSS 공격의 핵심 방어 헤더
// - unsafe-inline: Next.js 인라인 스크립트/Tailwind 인라인 스타일에 필요
// - unsafe-eval: Next.js HMR(개발 모드 전용)에 필요
// - frame-src https:: PDF iframe이 외부 URL일 수 있어 https 전체 허용
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.youtube.com https://js.tosspayments.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "frame-src https://www.youtube.com https://js.tosspayments.com https:",
  "connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.tosspayments.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // CSP — XSS, 데이터 유출, 클릭재킹 방지
          { key: "Content-Security-Policy", value: cspDirectives },
          // 클릭재킹 방지 — CSP frame-ancestors 미지원 브라우저 대비
          { key: "X-Frame-Options", value: "DENY" },
          // MIME 스니핑 방지
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer 정보 최소화
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HTTPS 강제 (1년)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // XSS 방지 (구형 브라우저)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // 브라우저 기능 제한
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  silent: !process.env.SENTRY_AUTH_TOKEN,
});
