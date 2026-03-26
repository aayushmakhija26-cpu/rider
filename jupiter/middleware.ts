import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  signToken,
  validateSessionCookieValue,
  type SessionData,
} from '@/lib/auth/session';
import type { Role } from '@prisma/client';
import { ROUTE_RULES, getRoleHome } from '@/lib/auth/route-rules';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find the first matching rule
  const rule = ROUTE_RULES.find(r => pathname.startsWith(r.prefix));

  // No rule matched → public page (e.g. root /, /pricing)
  if (!rule || rule.access === 'public') {
    return slideSession(request, null);
  }

  // Verify session
  const sessionCookie = request.cookies.get('session');
  let parsed: SessionData | null = null;
  if (sessionCookie) {
    parsed = await validateSessionCookieValue(sessionCookie.value);
  }

  // Unauthenticated-only routes: redirect logged-in users to their home
  if (rule.access === 'unauthenticated-only') {
    if (parsed) {
      return NextResponse.redirect(new URL(getRoleHome(parsed.role), request.url));
    }
    // If there's a session cookie but validation failed, delete the stale cookie
    const response = NextResponse.next();
    if (sessionCookie && !parsed) {
      response.cookies.delete('session');
    }
    return response;
  }

  // Protected route: must be authenticated
  if (!parsed) {
    const redirect = NextResponse.redirect(new URL('/sign-in', request.url));
    if (sessionCookie) redirect.cookies.delete('session');
    return redirect;
  }

  // Role check
  const allowedRoles = rule.access as Role[];
  if (!allowedRoles.includes(parsed.role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Allowed — slide session
  return slideSession(request, parsed);
}

async function slideSession(request: NextRequest, parsed: SessionData | null): Promise<NextResponse> {
  const res = NextResponse.next();
  if (parsed && request.method === 'GET') {
    // Calculate expiry: 24 hours from now, with safeguard against arithmetic overflow
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const expiryTime = Math.min(Date.now() + ONE_DAY_MS, Number.MAX_SAFE_INTEGER);
    const expiresInOneDay = new Date(expiryTime);
    res.cookies.set({
      name: 'session',
      value: await signToken({ ...parsed, expires: expiresInOneDay.toISOString() }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresInOneDay,
      path: '/',
    });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
