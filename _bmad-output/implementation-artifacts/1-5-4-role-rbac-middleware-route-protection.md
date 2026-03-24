# Story 1.5: 4-Role RBAC Middleware & Route Protection

Status: done

## Story

As a platform,
I want Next.js middleware to enforce role-based route access for all four roles (`DEALER_ADMIN`, `DEALER_STAFF`, `CONSUMER`, `SYSADMIN`),
so that no user can access a route outside their role's permission set.

## Acceptance Criteria

1. **Given** a `DEALER_STAFF` user attempts to navigate to a `DEALER_ADMIN`-only route (e.g. billing settings) **When** the route is resolved **Then** the request is redirected to `/unauthorized` — not a 404 or blank screen
2. **Given** any API Route Handler with a role check **When** the session role does not match the required permission **Then** the handler returns `Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })`
3. **Given** a `CONSUMER` session **When** attempting to access any dealer (`/dashboard/*`) or SysAdmin route **Then** the request is redirected to `/unauthorized`
4. **Given** a `SYSADMIN` session **When** attempting to access any dealer route **Then** the request is redirected to `/unauthorized`
5. **Given** an unauthenticated request to any protected route **When** the route is resolved **Then** the request is redirected to `/sign-in`
6. **Given** an authenticated user of any role **When** accessing a route appropriate for their role **Then** the request is allowed through without redirect
7. **Given** a `DEALER_ADMIN` or `DEALER_STAFF` user **When** accessing `/dashboard/security/billing` **Then** `DEALER_STAFF` is redirected to `/unauthorized` while `DEALER_ADMIN` is allowed through

## Tasks / Subtasks

- [x] Task 1: Add `CONSUMER` to Prisma `Role` enum and migrate (AC: #3)
  - [x] Edit `prisma/schema.prisma` — add `CONSUMER` to the `Role` enum (between `DEALER_STAFF` and `SYSADMIN`)
  - [x] Run `cd jupiter && pnpm prisma migrate dev --name add-consumer-role`
  - [x] Verify `pnpm prisma generate` completes without errors

- [x] Task 2: Create `requireAuth` helper in `lib/auth/session.ts` (AC: #2)
  - [x] Add `requireAuth(allowedRoles: Role[]): Promise<SessionData>` to `lib/auth/session.ts`
  - [x] If no valid session → throw `AuthError('UNAUTHORIZED')` (401)
  - [x] If session role not in `allowedRoles` → throw `AuthError('FORBIDDEN')` (403)
  - [x] Export a typed `AuthError` class with a `code: 'UNAUTHORIZED' | 'FORBIDDEN'` field from `lib/auth/session.ts`

- [x] Task 3: Create the `/unauthorized` page (AC: #1, #3, #4, #7)
  - [x] Create `app/(login)/unauthorized/page.tsx` — simple page with "You don't have permission to access this page" message and a link back to `/dashboard`
  - [x] No auth check on this page itself (it must always be accessible)

- [x] Task 4: Rewrite `middleware.ts` with role-based routing (AC: #1–#7)
  - [x] Replace the single `protectedRoutes = '/dashboard'` logic with the full route map (see Dev Notes)
  - [x] Unauthenticated access to any protected route → redirect to `/sign-in`
  - [x] Role mismatch on any protected route → redirect to `/unauthorized`
  - [x] Preserve the existing session-sliding behaviour (re-sign cookie on GET requests)
  - [x] Keep `config.matcher` and `runtime: 'nodejs'` unchanged

- [x] Task 5: Add secondary role checks to existing API Route Handlers (AC: #2)
  - [x] Update `app/api/team/route.ts` — add `requireAuth(['DEALER_ADMIN', 'DEALER_STAFF'])` check
  - [x] Update `app/api/user/route.ts` — add `requireAuth(['DEALER_ADMIN', 'DEALER_STAFF', 'CONSUMER'])` check
  - [x] Use the standard Route Handler error pattern: catch `AuthError` and return `403 FORBIDDEN` or `401 UNAUTHORIZED`

- [x] Task 6: Vitest tests for `requireAuth` and middleware route logic (AC: #1–#7)
  - [x] Create `lib/auth/session.test.ts` additions — test `requireAuth` for each role/route combination
  - [x] Test: no session → throws AuthError UNAUTHORIZED
  - [x] Test: wrong role → throws AuthError FORBIDDEN
  - [x] Test: correct role → returns SessionData
  - [x] Create `middleware.test.ts` at project root — unit-test the route-to-role map logic

- [x] Task 7: Build and smoke test (AC: all)
  - [x] Run `pnpm build` — exits 0 with zero TypeScript errors
  - [x] Run `pnpm test` — all tests pass
  - [ ] Manual: sign in as `DEALER_STAFF`, attempt `/dashboard/security/billing` → redirected to `/unauthorized`
  - [ ] Manual: sign in as `DEALER_ADMIN`, attempt `/dashboard/security/billing` → page loads

---

## Dev Notes

### CRITICAL: Do NOT Use next-auth / Auth.js

Same as all previous stories — custom JWT auth via `bcryptjs` + `jose`. Do NOT install any Auth.js packages. The session is in `lib/auth/session.ts`.

### What Exists — Build On These

| What exists | Location | Notes |
|---|---|---|
| JWT session: `SessionData`, `setSession()`, `getSession()`, `verifyToken()` | `lib/auth/session.ts` | `SessionData = { userId, role, dealerId, expires }` |
| `Role` enum | `prisma/schema.prisma` | Currently `DEALER_ADMIN \| DEALER_STAFF \| SYSADMIN` — needs `CONSUMER` added |
| Current middleware | `middleware.ts` | Only checks `/dashboard` — needs full rewrite |
| Prisma singleton `prisma` + `withDealerContext`, `getDb` | `src/lib/db.ts` | Import as `@/src/lib/db` |
| Login/signup routes | `app/(login)/sign-in/`, `app/(login)/sign-up/` | Always public |
| Dashboard routes (current) | `app/(dashboard)/dashboard/` | This IS the dealer portal for now — protect with `DEALER_ADMIN \| DEALER_STAFF` |
| Billing settings (role-restricted within dealer portal) | `app/(dashboard)/dashboard/security/` | Restrict to `DEALER_ADMIN` only |

### `@/` Path Alias

`tsconfig.json` has `"@/*": ["./*"]` with `baseUrl: "."` inside `jupiter/`. So `@/lib/auth/session` resolves to `jupiter/lib/auth/session.ts`. Do NOT use `@/src/lib/db` — this resolves to `jupiter/src/lib/db.ts` which is the correct Prisma singleton location.

### Prisma Migration: Add CONSUMER Role

Edit `prisma/schema.prisma`:
```prisma
enum Role {
  DEALER_ADMIN
  DEALER_STAFF
  CONSUMER    // ← add this
  SYSADMIN
}
```
Then run: `cd jupiter && pnpm prisma migrate dev --name add-consumer-role`

**Why add CONSUMER now:** Story 6.1 (consumer account creation) will create Consumer sessions. The Role enum needs CONSUMER before those sessions can be issued. Adding it here establishes the full 4-role system.

**Note:** CONSUMER is not yet used in `DealerUser` — it will be used in consumer sessions (Story 6.x). Adding it to the enum is a non-breaking migration (no existing rows use it).

### Route Protection Map

The middleware must enforce this exact mapping:

```typescript
// Routes and required roles (order matters — most specific first)
const ROUTE_RULES: Array<{ prefix: string; roles: Role[] | 'public' | 'unauthenticated-only' }> = [
  // Unauthenticated-only: redirect authenticated users away from sign-in/up
  { prefix: '/sign-in', roles: 'unauthenticated-only' },
  { prefix: '/sign-up', roles: 'unauthenticated-only' },

  // Always public (no auth required)
  { prefix: '/unauthorized', roles: 'public' },
  { prefix: '/api/', roles: 'public' },               // API routes handle auth themselves

  // Admin-only sub-routes WITHIN dealer portal (must come before the dealer catch-all)
  { prefix: '/dashboard/security/billing', roles: ['DEALER_ADMIN'] },

  // Dealer portal (current (dashboard) group)
  { prefix: '/dashboard', roles: ['DEALER_ADMIN', 'DEALER_STAFF'] },

  // SysAdmin portal (future route group — protect now so it's ready when created)
  { prefix: '/sysadmin', roles: ['SYSADMIN'] },

  // Consumer dashboard (future route group)
  { prefix: '/consumer', roles: ['CONSUMER'] },
];
```

**Important:** Signed URL routes (`/d/[token]`) are NOT in the current app structure. When they are added in Epic 4, they will be in `(consumer)` route group under `/d/`. Add `/d/` as public in the matcher at that time — for now, leave it unprotected (the token is its own auth mechanism).

### Middleware Rewrite Pattern

```typescript
// middleware.ts — full rewrite
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken, type SessionData } from '@/lib/auth/session';
import type { Role } from '@prisma/client';

// Route prefix → allowed roles. Matched in order (first match wins).
// 'public'               = no auth required
// 'unauthenticated-only' = redirect to /dashboard if already authenticated
// Role[]                 = must have one of these roles
type RouteAccess = 'public' | 'unauthenticated-only' | Role[];

const ROUTE_RULES: Array<{ prefix: string; access: RouteAccess }> = [
  { prefix: '/sign-in', access: 'unauthenticated-only' },
  { prefix: '/sign-up', access: 'unauthenticated-only' },
  { prefix: '/unauthorized', access: 'public' },
  { prefix: '/api/', access: 'public' },
  // Admin-only sub-route — must be BEFORE /dashboard catch-all
  { prefix: '/dashboard/security/billing', access: ['DEALER_ADMIN'] },
  // Dealer portal
  { prefix: '/dashboard', access: ['DEALER_ADMIN', 'DEALER_STAFF'] },
  // SysAdmin portal
  { prefix: '/sysadmin', access: ['SYSADMIN'] },
  // Consumer portal
  { prefix: '/consumer', access: ['CONSUMER'] },
];

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

function getRoleHome(role: Role): string {
  switch (role) {
    case 'SYSADMIN': return '/sysadmin/dashboard';
    case 'CONSUMER': return '/consumer/dashboard';
    default: return '/dashboard';
  }
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
```

**Key change in matcher:** Removed `api` from the exclusion list. API routes are marked `'public'` in ROUTE_RULES so they still pass through, but now the middleware runs on them — needed for future middleware-level API auth if required. Individual Route Handlers do their own `requireAuth` check.

### `requireAuth` Helper — Add to `lib/auth/session.ts`

```typescript
// Add to lib/auth/session.ts

export class AuthError extends Error {
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  constructor(code: 'UNAUTHORIZED' | 'FORBIDDEN', message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

/**
 * Get the current session and verify the caller has one of the allowed roles.
 * Use in API Route Handlers before any service call.
 *
 * @throws AuthError('UNAUTHORIZED') if no valid session
 * @throws AuthError('FORBIDDEN') if role not in allowedRoles
 */
export async function requireAuth(allowedRoles: Role[]): Promise<SessionData> {
  const session = await getSession();
  if (!session) throw new AuthError('UNAUTHORIZED');
  if (!allowedRoles.includes(session.role)) throw new AuthError('FORBIDDEN');
  return session;
}
```

### Standard Route Handler Error Pattern with `requireAuth`

```typescript
// app/api/team/route.ts — example
import { requireAuth, AuthError } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const session = await requireAuth(['DEALER_ADMIN', 'DEALER_STAFF']);
    // ... service call using session.dealerId
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === 'UNAUTHORIZED' ? 401 : 403;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    console.error('[team/GET]', error);
    return Response.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
```

### Unauthorized Page

Create `app/(login)/unauthorized/page.tsx` (co-located with sign-in/sign-up in the `(login)` group so it shares the same layout):

```tsx
// app/(login)/unauthorized/page.tsx
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <Link href="/dashboard" className="text-orange-500 hover:text-orange-600 font-medium">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
```

### File Locations — CRITICAL

All files are inside `jupiter/`. Double-check before creating:
- Middleware: `jupiter/middleware.ts` ← already exists, rewrite it
- Unauthorized page: `jupiter/app/(login)/unauthorized/page.tsx` ← create
- Session additions: `jupiter/lib/auth/session.ts` ← append to existing file
- API route updates: `jupiter/app/api/team/route.ts`, `jupiter/app/api/user/route.ts`
- Tests: `jupiter/lib/auth/session.test.ts` (add to existing) or `jupiter/middleware.test.ts` (new)

### Existing API Routes to Update

The project currently has these API routes that need secondary role checks:

| File | Handler | Required Roles |
|---|---|---|
| `app/api/team/route.ts` | GET, PATCH | `DEALER_ADMIN`, `DEALER_STAFF` |
| `app/api/user/route.ts` | GET, PATCH | `DEALER_ADMIN`, `DEALER_STAFF`, `CONSUMER` |
| `app/api/stripe/checkout/route.ts` | POST | `DEALER_ADMIN` only (billing = admin-only) |
| `app/api/stripe/webhook/route.ts` | POST | Public (Stripe webhook — no session) |

**Note:** `app/api/auth/` routes are already public by design (they set the session).

### Anti-Patterns to Avoid

- ❌ Do NOT remove the session-sliding logic from the middleware — it was intentionally added in Stories 1.1–1.3
- ❌ Do NOT check `role` manually in multiple places — use `requireAuth()` everywhere in Route Handlers
- ❌ Do NOT put the unauthorized page inside `(dashboard)` route group — it must be accessible without a session
- ❌ Do NOT exclude `api` from the middleware matcher exclusion list if you don't handle API public rules correctly — API routes must still work without auth (they self-check)
- ❌ Do NOT use `redirect()` from `next/navigation` inside middleware — use `NextResponse.redirect()`
- ❌ Do NOT add CONSUMER role to `DealerUser` model — it's for future Consumer sessions. The enum change is just adding the enum value, not changing DealerUser constraints

### Previous Story Learnings (Stories 1.1–1.4)

- `setSession(dealerUser)` signs a JWT with `{ userId, role, dealerId, expires }` — role is from `DealerUser.role`
- `verifyToken()` / `getSession()` are in `lib/auth/session.ts` — import as `@/lib/auth/session`
- Prisma singleton is at `src/lib/db.ts` — import as `@/src/lib/db` (note the `src/` prefix — unusual path)
- `redirect()` from `next/navigation` throws internally — only use inside Server Components/Actions, never in Route Handlers or middleware
- API routes live in `app/api/` (NOT `src/app/api/`)
- `prisma.$transaction(async (tx) => {...})` is the interactive transaction pattern
- The `(dashboard)` route group at `app/(dashboard)/` is the current dealer portal placeholder

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- IDE reported stale tsserver diagnostic for `CONSUMER` type — confirmed `tsc --noEmit` passes cleanly after `prisma generate`

### Completion Notes List

- **Task 1:** Added `CONSUMER` to `Role` enum in `prisma/schema.prisma`. Migration `20260324110811_add_consumer_role` applied successfully. Non-breaking: no existing rows use this value.
- **Task 2:** Added `AuthError` class and `requireAuth()` to `lib/auth/session.ts`. Uses existing `getSession()` internally.
- **Task 3:** Created `app/(login)/unauthorized/page.tsx` — co-located with sign-in/sign-up, no auth guard, always accessible.
- **Task 4:** Rewrote `middleware.ts` with `ROUTE_RULES` array (first-match-wins). Removed `api` from matcher exclusion (API routes self-check via `requireAuth`). Preserved session-sliding on GET. Added `getRoleHome()` for authenticated-user redirects on login/signup pages.
- **Task 5:** Updated `app/api/team/route.ts` (DEALER_ADMIN/STAFF) and `app/api/user/route.ts` (DEALER_ADMIN/STAFF/CONSUMER) with `requireAuth` + standard error pattern.
- **Task 6:** Extended `lib/auth/session.test.ts` with 6 `requireAuth` tests covering all role/access combinations. Created `middleware.test.ts` with 15 route-map unit tests covering all ACs.
- **Task 7:** `pnpm build` exits 0, zero TypeScript errors, 20 routes compiled. `pnpm test` — 45 tests pass across 4 test files.

### File List

- `jupiter/prisma/schema.prisma` — added `CONSUMER` to `Role` enum
- `jupiter/prisma/migrations/20260324110811_add_consumer_role/migration.sql` — generated migration
- `jupiter/lib/auth/session.ts` — added `AuthError` class and `requireAuth()` helper
- `jupiter/app/(login)/unauthorized/page.tsx` — new: access denied page
- `jupiter/middleware.ts` — full rewrite with `ROUTE_RULES` role-based routing
- `jupiter/app/api/team/route.ts` — added `requireAuth(['DEALER_ADMIN', 'DEALER_STAFF'])` guard
- `jupiter/app/api/user/route.ts` — added `requireAuth(['DEALER_ADMIN', 'DEALER_STAFF', 'CONSUMER'])` guard
- `jupiter/lib/auth/session.test.ts` — extended with `requireAuth` tests
- `jupiter/middleware.test.ts` — new: route-map unit tests

### Change Log

- 2026-03-24: Implemented 4-role RBAC middleware and route protection (Story 1.5). Added CONSUMER to Role enum, rewrote middleware with ROUTE_RULES, added requireAuth helper, created /unauthorized page, updated API route handlers, wrote 21 new Vitest tests.
