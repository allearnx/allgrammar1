import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// AI 학습용 크롤러 강제 차단 (robots.ts와 짝 — robots를 무시하는 봇 대비 2차 방어선).
// Google-Extended/Applebot-Extended는 robots 전용 토큰이라 UA 목록엔 없음.
// AI 검색·인용 크롤러(OAI-SearchBot, Claude-SearchBot, PerplexityBot 등)는 허용.
const AI_TRAINING_BOT_UA = /GPTBot|CCBot|ClaudeBot|anthropic-ai|Bytespider|meta-externalagent/i;

export async function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  if (AI_TRAINING_BOT_UA.test(ua)) {
    return new NextResponse(null, { status: 403 });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - they handle their own auth)
     * - sw.js (서비스워커 — 리다이렉트되면 PWA 등록 실패)
     */
    // robots.txt를 제외 안 하면 로그인으로 리다이렉트되어 검색엔진이 못 읽는다 (2026-07-17 발견)
    '/((?!_next/static|_next/image|favicon.ico|sw.js|robots.txt|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|woff|woff2|ttf)$).*)',
  ],
};
