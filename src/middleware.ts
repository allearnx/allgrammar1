import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 구글 주소이전: .kr 도메인 → home 301 리디렉트
  if (request.nextUrl.hostname === 'allrounderenglish.kr') {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, 'https://home.allrounderenglish.co.kr');
    return NextResponse.redirect(url, 301);
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
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
