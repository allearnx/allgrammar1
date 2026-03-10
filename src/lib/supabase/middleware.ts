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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // getSession() reads JWT locally (no network call unless token refresh needed)
  // getUser() was calling Supabase Auth server on EVERY navigation (~200ms)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/signup', '/callback', '/report', '/quiz-result'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If not authenticated and not on a public route, redirect to login
  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If authenticated, check role and handle routing
  if (session) {
    // Try cached profile from cookie first (avoids DB call on every navigation)
    let profile: { id: string; email: string; full_name: string; role: string; academy_id: string | null } | null = null;
    let cacheHit = false;

    const cachedProfileStr = request.cookies.get('x-user-profile')?.value;
    if (cachedProfileStr) {
      try {
        const parsed = JSON.parse(cachedProfileStr);
        if (parsed.id === session.user.id) {
          profile = parsed;
          cacheHit = true;
        }
      } catch {
        // Invalid cache, will re-fetch
      }
    }

    // Cache miss: fetch from DB
    if (!profile) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다');
      const admin = createClient(
        supabaseUrl,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data } = await admin
        .from('users')
        .select('id, email, full_name, role, academy_id')
        .eq('id', session.user.id)
        .single();
      profile = data;
    }

    const role = (profile?.role || 'student') as UserRole;

    // If on a public route or root, redirect to dashboard
    if (isPublicRoute || pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboard(role);
      return NextResponse.redirect(url);
    }

    // Role-based route protection
    for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
      if (pathname.startsWith(routePrefix) && !allowedRoles.includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = getRoleDashboard(role);
        return NextResponse.redirect(url);
      }
    }

    // Pass user profile to server components via request header
    if (profile) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-profile', JSON.stringify(profile));
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
  }

  return supabaseResponse;
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
