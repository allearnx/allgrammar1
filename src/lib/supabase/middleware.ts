import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { isSafeRedirect } from '@/lib/auth/redirect';
import {
  hashAuthCookies,
  signProfileToken,
  verifyProfileToken,
  type CachedProfile,
} from '@/lib/auth/profile-cache';

type UserRole = 'student' | 'teacher' | 'admin' | 'boss';

const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/student': ['student', 'boss'],
  '/teacher': ['teacher', 'admin', 'boss'],
  '/admin': ['admin', 'boss'],
  '/boss': ['boss'],
};

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다');
  }

  // 클라이언트가 보낸 x-user-profile 헤더는 절대 신뢰하지 않는다 — 미들웨어가
  // 검증 후 직접 셋팅하는 값만 서버로 전달 (스푸핑 차단)
  const sanitizedHeaders = new Headers(request.headers);
  sanitizedHeaders.delete('x-user-profile');

  let supabaseResponse = NextResponse.next({
    request: { headers: sanitizedHeaders },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: sanitizedHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = [
    '/login', '/signup', '/callback', '/impersonate', '/report', '/quiz-result', '/parent',
    '/find-email', '/forgot-password', '/reset-password', '/level-test',
    '/courses', '/teachers', '/reviews', '/faq', '/allkill', '/about',
    '/curriculum', '/schedule', '/terms', '/privacy', '/trial', '/pricing', '/blog',
  ];
  const isPublicRoute = pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route));

  // Try cached profile from cookie first (avoids DB + auth call on every navigation)
  // 캐시는 HMAC 서명 + 현재 인증 쿠키 해시 바인딩을 통과해야만 신뢰한다.
  // 다른 계정으로 재로그인하면 sb-* 쿠키가 바뀌어 해시가 불일치 → 자동 캐시 미스.
  let profile: CachedProfile | null = null;
  let cacheHit = false;
  let sessionHash = await hashAuthCookies(request.cookies.getAll());
  const cachedToken = request.cookies.get('x-user-profile')?.value;
  if (cachedToken) {
    profile = await verifyProfileToken(cachedToken, sessionHash);
    cacheHit = profile !== null;
  }

  // Cache miss: verify JWT via getUser() (server-side signature check)
  if (!cacheHit) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      // Not authenticated
      if (!isPublicRoute) {
        const loginUrl = new URL('/login', request.nextUrl.origin);
        loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
        return NextResponse.redirect(loginUrl);
      }
      return supabaseResponse;
    }
    // Fetch profile from DB
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다');
    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data } = await admin
      .from('users')
      .select('id, email, full_name, role, academy_id, is_homepage_manager')
      .eq('id', user.id)
      .single();
    if (data) {
      let canManageContent = false;
      let naesinEnabled = false;
      if (data.academy_id) {
        const { data: acad } = await admin
          .from('academies')
          .select('can_manage_content, naesin_enabled')
          .eq('id', data.academy_id)
          .single();
        canManageContent = acad?.can_manage_content ?? false;
        naesinEnabled = acad?.naesin_enabled ?? false;
      }
      profile = { ...data, can_manage_content: canManageContent, naesin_enabled: naesinEnabled };
    }
  }

  // If no profile (not authenticated), handle redirect
  if (!profile) {
    if (!isPublicRoute) {
      const loginUrl = new URL('/login', request.nextUrl.origin);
      loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // Authenticated from here
  const role = (profile.role || 'student') as UserRole;

  // getUser()가 토큰을 갱신했을 수 있으므로 해시 재계산 후 서명 토큰 생성
  if (!cacheHit) {
    sessionHash = await hashAuthCookies(request.cookies.getAll());
  }
  const profileToken = await signProfileToken(profile, sessionHash);

  // Public routes that stay accessible even when authenticated (no redirect)
  // reset-password: 이메일 링크의 복구 세션(PASSWORD_RECOVERY)이 인증 상태라 대시보드로 튕기면 안 됨
  const noRedirectRoutes = [
    '/parent', '/report', '/quiz-result', '/reset-password',
    '/courses', '/teachers', '/reviews', '/faq', '/allkill', '/about',
    '/curriculum', '/schedule', '/terms', '/privacy', '/trial', '/pricing', '/blog',
  ];
  const isNoRedirectRoute = pathname === '/' || noRedirectRoutes.some((route) => pathname.startsWith(route));

  // If on a public route (login/signup), redirect to dashboard (except noRedirect pages)
  if (isPublicRoute && !isNoRedirectRoute) {
    const nextParam = request.nextUrl.searchParams.get('next');
    const target = isSafeRedirect(nextParam) ? nextParam : getRoleDashboard(role);
    return NextResponse.redirect(new URL(target, request.nextUrl.origin));
  }

  // For no-redirect routes (public pages), pass through with profile headers
  if (isNoRedirectRoute) {
    sanitizedHeaders.set('x-user-profile', profileToken);
    const response = NextResponse.next({
      request: { headers: sanitizedHeaders },
    });
    supabaseResponse.headers.getSetCookie().forEach((cookie) => {
      response.headers.append('set-cookie', cookie);
    });
    // Always refresh cookie (sliding expiration)
    response.cookies.set('x-user-profile', profileToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });
    return response;
  }

  // Homepage manager routes (accessible by is_homepage_manager regardless of role)
  const homepageManagerRoutes = [
    '/boss/consultations', '/boss/courses', '/boss/teacher-profiles',
    '/boss/reviews', '/boss/faqs',
  ];
  const isHomepageManagerRoute = homepageManagerRoutes.some((r) => pathname.startsWith(r));

  // Role-based route protection
  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
    if (pathname.startsWith(routePrefix) && !allowedRoles.includes(role)) {
      // Allow homepage managers to access homepage management routes
      if (isHomepageManagerRoute && profile.is_homepage_manager) {
        break;
      }
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboard(role);
      return NextResponse.redirect(url);
    }
  }

  // Pass user profile to server components via request header
  sanitizedHeaders.set('x-user-profile', profileToken);
  const response = NextResponse.next({
    request: { headers: sanitizedHeaders },
  });
  supabaseResponse.headers.getSetCookie().forEach((cookie) => {
    response.headers.append('set-cookie', cookie);
  });
  // Always refresh cookie (sliding expiration — extends on every navigation)
  response.cookies.set('x-user-profile', profileToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });
  return response;
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'teacher':
      return '/teacher';
    case 'admin':
      return '/admin';
    case 'boss':
      return '/boss';
    default:
      return '/student';
  }
}
