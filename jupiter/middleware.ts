import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken, type SessionData } from '@/lib/auth/session';
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
    try {
      parsed = await verifyToken(sessionCookie.value);
    } catch { /* invalid/expired */ }
  }

  // Unauthenticated-only routes: redirect logged-in users to their home
  if (rule.access === 'unauthenticated-only') {
    if (parsed) {
      return NextResponse.redirect(new URL(getRoleHome(parsed.role), request.url));
    }
    return NextResponse.next();
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
    const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
