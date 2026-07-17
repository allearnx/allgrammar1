import type { MetadataRoute } from 'next';

/**
 * AI 학습용 크롤러 차단 목록 (2026-07-17 사장님 결정: "학습용만 차단").
 * - 차단: 모델 학습에 쓰이는 크롤러 (콘텐츠가 학습 데이터로 흡수되는 것 방지)
 * - 허용: AI 검색/답변 인용 크롤러 (OAI-SearchBot, Claude-SearchBot, PerplexityBot,
 *   ChatGPT-User, Claude-User 등) — ChatGPT/Perplexity 검색에서 올라영이 추천·인용될
 *   기회는 유지 (올킬보카 브랜드 검색 전략과 맞물림)
 * robots를 무시하는 봇은 middleware의 UA 차단이 2차로 막는다.
 */
const AI_TRAINING_BOTS = [
  'GPTBot',            // OpenAI 학습
  'CCBot',             // Common Crawl (학습 데이터셋 원천)
  'Google-Extended',   // Google Gemini 학습 (robots 전용 토큰)
  'Applebot-Extended', // Apple AI 학습 (robots 전용 토큰)
  'ClaudeBot',         // Anthropic 학습
  'anthropic-ai',
  'Bytespider',        // ByteDance 학습
  'meta-externalagent', // Meta AI 학습
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.allrounderenglish.co.kr';

  return {
    rules: [
      ...AI_TRAINING_BOTS.map((bot) => ({ userAgent: bot, disallow: '/' })),
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/find-email',
          '/callback',
          '/impersonate',
          '/student/',
          '/teacher/',
          '/admin/',
          '/boss/',
          '/api/',
          '/parent/',
          '/billing/',
          '/payment/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
