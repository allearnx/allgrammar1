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
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/signup', '/callback'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If not authenticated and not on a public route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If authenticated, fetch role once and handle routing
  if (user) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: profile } = await admin
      .from('users')
      .select('id, email, full_name, role, academy_id')
      .eq('id', user.id)
      .single();

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
    // so the layout doesn't need to re-fetch auth + profile (saves ~2 network calls)
    if (profile) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-profile', JSON.stringify(profile));
      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      supabaseResponse.headers.getSetCookie().forEach((cookie) => {
        response.headers.append('set-cookie', cookie);
      });
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
