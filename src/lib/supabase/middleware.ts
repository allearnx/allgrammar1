import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

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

  let supabaseResponse = NextResponse.next({
    request,
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
            request,
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
    '/login', '/signup', '/callback', '/report', '/quiz-result', '/parent',
    '/courses', '/teachers', '/reviews', '/faq', '/allkill', '/about',
    '/curriculum', '/schedule', '/terms', '/privacy',
  ];
  const isPublicRoute = pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route));

  // Try cached profile from cookie first (avoids DB + auth call on every navigation)
  let profile: { id: string; email: string; full_name: string; role: string; academy_id: string | null; is_homepage_manager?: boolean } | null = null;
  let cacheHit = false;
  const cachedProfileStr = request.cookies.get('x-user-profile')?.value;
  if (cachedProfileStr) {
    try {
      profile = JSON.parse(cachedProfileStr);
      cacheHit = true;
    } catch {
      // Invalid cache, will re-verify
    }
  }

  // Cache miss: verify JWT via getUser() (server-side signature check)
  if (!cacheHit) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      // Not authenticated
      if (!isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
        return NextResponse.redirect(url);
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
    profile = data;
  }

  // If no profile (not authenticated), handle redirect
  if (!profile) {
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Authenticated from here
  const role = (profile.role || 'student') as UserRole;

  // Public routes that stay accessible even when authenticated (no redirect)
  const noRedirectRoutes = [
    '/parent', '/report', '/quiz-result',
    '/courses', '/teachers', '/reviews', '/faq', '/allkill', '/about',
    '/curriculum', '/schedule', '/terms', '/privacy',
  ];
  const isNoRedirectRoute = pathname === '/' || noRedirectRoutes.some((route) => pathname.startsWith(route));

  // If on a public route (login/signup), redirect to dashboard (except noRedirect pages)
  if (isPublicRoute && !isNoRedirectRoute) {
    const url = request.nextUrl.clone();
    url.pathname = getRoleDashboard(role);
    return NextResponse.redirect(url);
  }

  // For no-redirect routes (public pages), pass through with profile headers
  if (isNoRedirectRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-profile', Buffer.from(JSON.stringify(profile)).toString('base64'));
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.headers.getSetCookie().forEach((cookie) => {
      response.headers.append('set-cookie', cookie);
    });
    if (!cacheHit) {
      response.cookies.set('x-user-profile', JSON.stringify(profile), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300,
        path: '/',
      });
    }
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
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-profile', Buffer.from(JSON.stringify(profile)).toString('base64'));
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.headers.getSetCookie().forEach((cookie) => {
    response.headers.append('set-cookie', cookie);
  });
  // Cache profile in cookie for subsequent navigations (5 min TTL)
  if (!cacheHit) {
    response.cookies.set('x-user-profile', JSON.stringify(profile), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    });
  }
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
