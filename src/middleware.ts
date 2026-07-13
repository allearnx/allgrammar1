import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
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
    '/((?!_next/static|_next/image|favicon.ico|sw.js|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|woff|woff2|ttf)$).*)',
  ],
};
