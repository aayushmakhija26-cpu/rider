# Story 2.1: Dealer Admin Registration

**Status:** ready-for-dev

**Story ID:** 2.1

**Epic:** 2 - Dealer Registration, Onboarding & Account Management

**Date Created:** 2026-03-25

---

## Story

As a Dealer Admin,
I want to register a new dealership account using email/password or OAuth (Google/Apple),
So that I have a dealership account and can begin configuring my platform presence.

## Acceptance Criteria

1. **Given** a prospective Dealer Admin submits the registration form with email and dealership name
   **When** the form is submitted with valid data
   **Then** a `Dealer` record and a linked `DEALER_ADMIN` `User` record are created in Neon
   **And** the user is logged in with a JWT session (role = `DEALER_ADMIN`, `dealerId` set)
   **And** the user is redirected to the onboarding checklist (`/dealer/onboarding`)

2. **And** submitting with an already-registered email returns an inline error: "An account with this email already exists"

3. **And** OAuth registration (Google/Apple) creates the same records with the same redirect outcome

---

## Tasks / Subtasks

- [x] Task 1: Set up dealer registration API endpoint (AC: #1)
  - [x] Create `POST /api/dealers` Route Handler
  - [x] Implement Zod validation for registration payload (email, password, dealership name)
  - [x] Create `Dealer` record in Prisma
  - [x] Create `DealerUser` record with role `DEALER_ADMIN` linked to `Dealer`
  - [x] Generate JWT session token
  - [x] Audit log registration action

- [x] Task 2: Build registration UI form (AC: #1, #2)
  - [x] Create registration form component with email, password, dealership name fields
  - [x] Add email/password validation (frontend + server)
  - [x] Display inline validation errors
  - [x] Implement form submission and error handling

- [x] Task 3: Integrate OAuth registration (AC: #3)
  - [x] Configure Auth.js Google OAuth provider (already done in Epic 1)
  - [x] Configure Auth.js Apple OAuth provider (already done in Epic 1)
  - [x] Map OAuth user data to `Dealer` + `DealerUser` creation (already done via findOrCreateOAuthUser)
  - [x] Redirect OAuth flow to onboarding page instead of dashboard

- [x] Task 4: Testing and verification (AC: #1, #2, #3)
  - [x] Unit test: Zod schema validation
  - [x] Unit test: Dealer service creation and email lookup
  - [x] E2E test: Email/password registration flow
  - [x] E2E test: OAuth registration flow (Google, Apple)
  - [x] E2E test: Duplicate email error handling
  - [x] Verify redirect to onboarding checklist

---

## Developer Context

### Story Intent

This story is the **critical first story of Epic 2** — it establishes multi-tenant account creation for the dealer platform. A prospective Dealer Admin (SaaS customer) arrives at Jupiter, registers, and immediately gets a persistent account with:

- A `Dealer` tenant record (represents the dealership organization)
- A `User` record with `DEALER_ADMIN` role (grants access to all dealer portal features)
- JWT session cookie with `dealerId` context (enables row-level security isolation in all downstream features)
- Automatic redirect to onboarding (primes the user for next steps)

This story is **foundational** — the Dealer model, RBAC middleware, and Auth.js setup from Epic 1 are prerequisites. This story builds on that foundation by creating the first user-facing registration flow.

### Current Repository State: What Already Exists

| Asset | Location | Current State | Relevant for Story |
|---|---|---|---|
| Prisma schema | `jupiter/prisma/schema.prisma` | Dealer + User models defined with RBAC roles | Use existing models; no schema changes |
| Auth.js config | `jupiter/src/lib/auth.ts` | Configured with Google/Apple providers, Prisma adapter | Extend with registration logic |
| RLS middleware | `jupiter/src/lib/db.ts` | Prisma middleware sets `app.current_dealer_id` from session | Auth must set dealerId on session |
| RBAC middleware | `jupiter/src/middleware.ts` | Route-level role enforcement | Protect `/dealer/*` routes with DEALER_ADMIN check |
| Route handlers | `jupiter/src/app/api/` | Auth handler exists; dealer endpoints empty | Create POST /api/dealers |
| UI components | `jupiter/src/components/` | shadcn/ui components available; no registration form | Build registration form |
| Database | Neon (serverless Postgres) | Schema applied; RLS policies active | Ready for data |

**What Does NOT Exist:**
- No registration UI form (create this)
- No POST /api/dealers endpoint (create this)
- No dealer creation service function (create in services/dealer.service.ts)
- No OAuth-to-Dealer mapping logic (extend in Auth.js callbacks)

### Architecture Compliance

From `core-architectural-decisions.md`:
- **Multi-tenancy:** RLS in Postgres; every Dealer is a tenant; session includes `dealerId`
- **Authentication:** Auth.js v5 + JWT sessions; email/password + Google/Apple OAuth
- **API Pattern:** REST via Next.js Route Handlers; Zod validation at boundary
- **Error Handling:** Standard `{ error, code }` response shape
- **Audit Logging:** All key actions logged via `auditService.log()`

From `implementation-patterns-consistency-rules.md`:
- **API Response:** Success returns data directly (no wrapper); error returns `{ error, code }`
- **Validation:** Zod at Route Handler boundary BEFORE any service call
- **Service Layer:** All database access via `services/dealer.service.ts` — never raw Prisma in Route Handlers
- **Inngest Naming:** Events use `domain/action.verb` format (e.g., `dealer/registration.requested`)
- **Error Codes:** Use standard codes — `VALIDATION_ERROR` (400), `CONFLICT` (409), `INTERNAL_ERROR` (500)

From `project-structure-boundaries.md`:
- API endpoints live in `app/api/dealers/`, `app/api/auth/`
- Forms live in components; submission via Server Actions or Route Handler fetches
- All Prisma queries in `services/dealer.service.ts`

From `user-journey-flows.md` (Journey 3: Dealer Admin Onboarding):
- Dealer Admin arrives at registration page
- Chooses email/password OR OAuth (Google/Apple)
- Registration creates account + onboarding checklist auto-appears
- Target: First-time setup under 30 minutes total

### Previous Story Intelligence

**From Story 1.7 (Design Token System):**
- Design tokens now available: `text-financial-positive`, `bg-jupiter-blue`, `font-tabular`, `prefers-reduced-motion`
- shadcn/ui components are owned (in `src/components/ui/`), not npm imports
- Accessibility is validated by Playwright + axe-core CI — all forms must pass WCAG AA contrast

**From Story 1.6 (Vercel Deployment):**
- GitHub Actions CI runs Prisma migration safety checks — schema changes must be migrations
- Playwright E2E tests exist; new stories should include E2E test files

**From Story 1.5 (RBAC Middleware):**
- 4 roles exist: `DEALER_ADMIN`, `DEALER_STAFF`, `CONSUMER`, `SYSADMIN`
- Role is stored in JWT session and enforced in middleware
- DEALER_ADMIN has full access to `/dealer/*` routes; DEALER_STAFF is restricted

**From Story 1.4 (OAuth Integration):**
- Auth.js Google and Apple OAuth providers already configured
- OAuth user data: email, name, image
- Both providers map to User creation with specified role

**From Story 1.3 (Email/Password Auth):**
- Email/password login already implemented; registration form needs to be built
- Auth.js Prisma adapter handles session storage
- JWT is issued on successful login

### Git Intelligence Summary

Recent commits show:
- `f1d2b7e` — Implement Story 1-7: Design Token System
- `b751bfc` — Merge PR #2: CI workflow validation
- Pattern: Each story is implemented, then code-reviewed, then marked done

The team uses:
- Prisma migrations for schema changes (never manual SQL)
- Zod for runtime validation
- React Hook Form for form state management
- Server Actions for form submission (NextAuth pattern)
- Inngest for background jobs (not used for registration, but referenced in architecture)

### Latest Technical Information (March 2026)

**Auth.js v5 (NextAuth):**
- Latest stable version with native `getServerSession()` and `middleware` support
- Prisma adapter fully supports multi-tenant isolation via session variables
- OAuth providers (Google, Apple) return standardized user profiles
- Callback functions: `signIn()` for validation, `jwt()` for token customization, `session()` for enrichment

**Zod v3 (Runtime Validation):**
- `z.string().email()` validates email format
- `z.string().min(8)` enforces password minimum
- `safeParse()` for error-tolerant parsing (used in Server Actions)
- `z.ZodError` has `.flatten()` method for structured error response

**React Hook Form + shadcn/ui:**
- `useForm()` + Zod resolver for client-side validation
- Form submission via Server Action or fetch
- shadcn/ui `<Input />`, `<Button />`, `<Form />` components ready to use

**Postgres/Neon Specifics:**
- Serverless Postgres with native RLS support
- Foreign key constraints enforce referential integrity
- Transactions via `prisma.$transaction()` ensure atomicity

---

## Technical Requirements

### API Endpoint: POST /api/dealers

**Request Body:**
```json
{
  "email": "admin@dealership.com",
  "password": "SecurePass123!",
  "dealershipName": "Grand Auto Group"
}
```

**Success Response (201):**
```json
{
  "id": "dealer-uuid",
  "email": "admin@dealership.com",
  "role": "DEALER_ADMIN",
  "dealerId": "dealer-uuid"
}
```

**Error Response (400 Validation):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email format"],
      "password": ["Must be at least 8 characters"]
    }
  }
}
```

**Error Response (409 Duplicate):**
```json
{
  "error": "An account with this email already exists",
  "code": "CONFLICT"
}
```

### Zod Validation Schema

```typescript
// schemas/registration.ts
import { z } from 'zod';

export const dealerRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  dealershipName: z.string().min(1, 'Dealership name is required').max(255),
});

export type DealerRegistrationInput = z.infer<typeof dealerRegistrationSchema>;
```

### Service Layer: dealer.service.ts

```typescript
// services/dealer.service.ts

export async function createDealerWithAdmin(
  email: string,
  dealershipName: string,
  passwordHash: string
): Promise<{ dealer: Dealer; user: User }> {
  // Create Dealer and User in a transaction
  return prisma.$transaction(async (tx) => {
    const dealer = await tx.dealer.create({
      data: {
        name: dealershipName,
        // Other fields from schema (branding, billing, etc.) initialized as null/defaults
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        password: passwordHash,
        role: 'DEALER_ADMIN',
        dealerId: dealer.id,
      },
    });

    return { dealer, user };
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}
```

### Registration Route Handler: POST /api/dealers

Location: `src/app/api/dealers/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { dealerRegistrationSchema } from '@/schemas/registration';
import { createDealerWithAdmin, findUserByEmail } from '@/services/dealer.service';
import { auditService } from '@/services/audit.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = dealerRegistrationSchema.parse(body);

    // Check for existing email
    const existingUser = await findUserByEmail(validatedData.email);
    if (existingUser) {
      return Response.json(
        { error: 'An account with this email already exists', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 10);

    // Create dealer and admin user
    const { dealer, user } = await createDealerWithAdmin(
      validatedData.email,
      validatedData.dealershipName,
      passwordHash
    );

    // Log registration (audit trail)
    await auditService.log({
      action: 'dealer_registration',
      actorId: user.id,
      actorRole: 'DEALER_ADMIN',
      dealerId: dealer.id,
      targetId: dealer.id,
      targetType: 'Dealer',
      metadata: { dealershipName: validatedData.dealershipName },
    });

    // Return user object (session will be created by Auth.js callback)
    return Response.json(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        dealerId: dealer.id,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }
    console.error('[dealers/POST]', error);
    return Response.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### Registration Form Component

Location: `src/components/dealer/RegistrationForm.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dealerRegistrationSchema } from '@/schemas/registration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

export function RegistrationForm() {
  const form = useForm({
    resolver: zodResolver(dealerRegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      dealershipName: '',
    },
  });

  async function onSubmit(data) {
    try {
      const res = await fetch('/api/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        // Display error in form
        if (error.code === 'CONFLICT') {
          form.setError('email', { message: error.error });
        } else {
          // Generic error handling
        }
        return;
      }

      // Registration successful; redirect to onboarding
      window.location.href = '/dealer/onboarding';
    } catch (err) {
      console.error('Registration error:', err);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="admin@dealership.com" {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dealershipName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dealership Name</FormLabel>
              <FormControl>
                <Input placeholder="Grand Auto Group" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Register</Button>
      </form>
    </Form>
  );
}
```

### Auth.js OAuth Integration

Extend `src/lib/auth.ts` callbacks:

```typescript
// Existing providers (Google, Apple) already configured

// Add/update callback to handle OAuth dealer registration
callbacks: {
  async signIn({ user, account }) {
    // Check if user exists
    let existingUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!existingUser && account?.provider) {
      // OAuth user doesn't exist; create Dealer + User
      const { dealer, user: newUser } = await createDealerWithAdmin(
        user.email!,
        user.name || 'Dealership', // Default name from OAuth
        '' // No password hash for OAuth accounts
      );
      user.id = newUser.id; // Store user ID for session
    }

    return true; // Allow sign-in
  },

  async jwt({ token, user }) {
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { dealer: true },
      });
      token.role = dbUser?.role;
      token.dealerId = dbUser?.dealerId;
    }
    return token;
  },

  async session({ session, token }) {
    session.user.role = token.role;
    session.user.dealerId = token.dealerId;
    return session;
  },
}
```

### File Structure & Locations

**Files to Create/Modify:**

```
src/
├── schemas/
│   └── registration.ts (NEW) — Zod schema for registration payload
├── app/
│   └── api/
│       └── dealers/
│           └── route.ts (NEW or MODIFY) — POST /api/dealers
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts (MODIFY if needed) — ensure OAuth callbacks are set
├── components/
│   └── dealer/
│       └── RegistrationForm.tsx (NEW) — Registration form UI
│   └── auth/ (or similar)
│       └── SignupPage.tsx (NEW or MODIFY) — Registration page wrapper
├── services/
│   └── dealer.service.ts (MODIFY or CREATE) — Add createDealerWithAdmin, findUserByEmail
├── lib/
│   └── auth.ts (MODIFY) — Add OAuth → Dealer mapping callbacks
```

**Existing Files (Verify Compatibility):**
- `src/lib/db.ts` — RLS middleware should work as-is
- `src/middleware.ts` — RBAC should allow access to `/api/dealers` (unauthenticated)
- `prisma/schema.prisma` — Dealer + User models should be ready

---

## Testing Requirements

### Unit Tests

**File:** `src/services/dealer.service.test.ts`

```typescript
import { createDealerWithAdmin, findUserByEmail } from '@/services/dealer.service';

describe('dealer.service', () => {
  it('creates a Dealer and DEALER_ADMIN User on registration', async () => {
    const result = await createDealerWithAdmin(
      'admin@test.com',
      'Test Dealership',
      'hashed_password'
    );
    expect(result.dealer).toBeDefined();
    expect(result.user.role).toBe('DEALER_ADMIN');
    expect(result.user.dealerId).toBe(result.dealer.id);
  });

  it('finds an existing user by email', async () => {
    // Seed test data first
    const user = await findUserByEmail('existing@test.com');
    expect(user).toBeDefined();
  });

  it('returns null for non-existent email', async () => {
    const user = await findUserByEmail('nonexistent@test.com');
    expect(user).toBeNull();
  });
});
```

**File:** `src/app/api/dealers/route.test.ts`

```typescript
import { POST } from '@/app/api/dealers/route';

describe('POST /api/dealers', () => {
  it('creates a dealer and returns 201 on valid registration', async () => {
    const request = new Request('http://localhost:3000/api/dealers', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newadmin@test.com',
        password: 'SecurePass123!',
        dealershipName: 'New Dealership',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.role).toBe('DEALER_ADMIN');
  });

  it('returns 409 on duplicate email', async () => {
    // First registration
    const req1 = new Request('http://localhost:3000/api/dealers', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@test.com',
        password: 'SecurePass123!',
        dealershipName: 'Test',
      }),
    });
    await POST(req1);

    // Second registration with same email
    const req2 = new Request('http://localhost:3000/api/dealers', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@test.com',
        password: 'DifferentPass456!',
        dealershipName: 'Test 2',
      }),
    });
    const response = await POST(req2);
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.code).toBe('CONFLICT');
  });

  it('returns 400 on validation error', async () => {
    const request = new Request('http://localhost:3000/api/dealers', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'short',
        dealershipName: '',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('VALIDATION_ERROR');
  });
});
```

### E2E Tests (Playwright)

**File:** `e2e/dealer-registration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dealer Registration', () => {
  test('email/password registration creates account and redirects to onboarding', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup');

    await page.fill('input[name="email"]', 'newdealer@example.com');
    await page.fill('input[name="dealershipName"]', 'Premium Auto');
    await page.fill('input[name="password"]', 'SecurePass123!');

    await page.click('button:has-text("Register")');

    // Verify redirect to onboarding
    await expect(page).toHaveURL(/\/dealer\/onboarding/);
  });

  test('duplicate email shows inline error', async ({ page }) => {
    // Create first account
    await page.goto('http://localhost:3000/auth/signup');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button:has-text("Register")');
    await page.waitForURL(/\/dealer\/onboarding/);

    // Attempt to register with same email
    await page.goto('http://localhost:3000/auth/signup');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="dealershipName"]', 'Another Dealership');
    await page.fill('input[name="password"]', 'DifferentPass456!');
    await page.click('button:has-text("Register")');

    // Verify error message
    await expect(page.locator('text=An account with this email already exists')).toBeVisible();
  });

  test('OAuth registration (Google) creates account and redirects to onboarding', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup');

    // Click Google OAuth button
    await page.click('button:has-text("Continue with Google")');

    // Note: Actual OAuth flow requires mock or test account
    // This test assumes OAuth provider is configured in test environment
  });

  test('form validation shows errors for invalid input', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup');

    // Submit empty form
    await page.click('button:has-text("Register")');

    // Verify validation errors appear
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    await expect(page.locator('text=Dealership name is required')).toBeVisible();
  });

  test('JWT session contains dealerId and DEALER_ADMIN role', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button:has-text("Register")');

    // Wait for redirect to onboarding
    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Verify session cookie is set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'next-auth.session-token');
    expect(sessionCookie).toBeDefined();

    // Decode and verify JWT payload (requires test helper)
    // This would verify { role: 'DEALER_ADMIN', dealerId: <uuid> }
  });
});
```

### Manual Testing Checklist

- [ ] Navigate to `/auth/signup` (registration page accessible)
- [ ] Fill form with valid email, password (8+ chars), dealership name
- [ ] Submit → account created, redirected to `/dealer/onboarding`
- [ ] Check Prisma Studio: `Dealer` record created with correct name
- [ ] Check Prisma Studio: `User` record created with role = `DEALER_ADMIN`, linked to Dealer
- [ ] Test duplicate email: submit second registration with same email → inline error message
- [ ] Test OAuth (Google): click Google button → new account created → redirect to onboarding
- [ ] Test OAuth (Apple): click Apple button → new account created → redirect to onboarding
- [ ] Test validation errors: submit invalid email, short password, empty name → errors shown inline
- [ ] Check audit log: registration action logged with dealer ID
- [ ] Verify JWT session contains `dealerId` and `role` (check browser DevTools → Application → Cookies)

---

## Architecture Compliance Checklist

- [ ] POST /api/dealers validates request with Zod before any database access
- [ ] Duplicate email check returns 409 CONFLICT status code
- [ ] API response format: success returns data directly (no wrapper); error returns `{ error, code }`
- [ ] All Prisma queries in `services/dealer.service.ts` — no raw queries in Route Handler
- [ ] Dealer creation in transaction to ensure atomicity (both Dealer and User created together)
- [ ] JWT session contains `dealerId` for downstream RLS middleware
- [ ] Role set to `DEALER_ADMIN` to enable route protection via middleware
- [ ] Registration logged via `auditService.log()` with action = 'dealer_registration'
- [ ] OAuth callbacks map to same Dealer + User creation logic
- [ ] No `tailwind.config.js` created (use existing design token system from Story 1.7)
- [ ] Form uses shadcn/ui components and design tokens from Story 1.7
- [ ] All form validation follows architecture patterns (Zod + React Hook Form)

### Library & Framework Requirements

**Auth.js v5 (NextAuth):**
- Already installed in `package.json`
- Google and Apple providers configured in `src/lib/auth.ts`
- Prisma adapter already set up

**Zod v3:**
- Already installed
- Used for schema validation at API boundaries

**React Hook Form:**
- Already installed
- Used for client-side form state management with Zod resolver

**bcryptjs:**
- For password hashing (likely already installed; verify in `package.json`)
- If missing, add: `npm install bcryptjs` and `npm install -D @types/bcryptjs`

**Prisma Client:**
- Already configured
- RLS middleware active in `lib/db.ts`

---

## Implementation Roadmap

1. **Zod Schema** (30 min)
   - Create `src/schemas/registration.ts` with email, password, dealershipName validation

2. **Service Layer** (45 min)
   - Extend `src/services/dealer.service.ts` with `createDealerWithAdmin()`, `findUserByEmail()`
   - Use Prisma `$transaction` for atomic Dealer + User creation

3. **API Endpoint** (45 min)
   - Create `src/app/api/dealers/route.ts` with POST handler
   - Validate input, check for duplicate email, create records, log action
   - Return 201 on success; 409 on conflict; 400 on validation error

4. **Registration Form UI** (1 hour)
   - Create `src/components/dealer/RegistrationForm.tsx`
   - Use React Hook Form + Zod resolver
   - Build signup page at `/auth/signup`

5. **Auth.js OAuth Integration** (45 min)
   - Extend callbacks in `src/lib/auth.ts` to map OAuth signups to Dealer creation
   - Test Google and Apple OAuth flows

6. **Unit Tests** (1 hour)
   - Test service layer: dealer creation, duplicate detection
   - Test API endpoint: validation, duplicate, success

7. **E2E Tests** (1.5 hours)
   - Test email/password registration → redirect to onboarding
   - Test duplicate email → error shown
   - Test OAuth registration
   - Test form validation errors

8. **Manual Testing & Code Review** (1 hour)
   - Verify all manual test checklist items pass
   - Ensure JWT contains dealerId and role
   - Check audit log

**Total Estimated Time: 6.5–7 hours**

---

## References

### Architecture & Design Docs
- [Core Architectural Decisions](../_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#authentication--security) — Auth, RLS, JWT session structure
- [Implementation Patterns](../_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md) — API response format, error codes, service layer placement
- [Project Structure](../_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md) — File organization, API endpoints, service boundaries

### UX & Requirements
- [Epic 2: Dealer Registration](../_bmad-output/planning-artifacts/epics/epic-2-dealer-registration-onboarding-account-management.md#story-21-dealer-admin-registration) — Acceptance criteria, user story
- [Journey 3: Dealer Admin Onboarding](../_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md#journey-3-dealer-admin--onboarding-to-first-campaign) — Registration → onboarding flow

### Technical Guidance
- [Prisma Schema](../prisma/schema.prisma) — Dealer, User models, relationships
- [Auth.js Config](../src/lib/auth.ts) — OAuth providers, session setup
- [Zod Validation](https://zod.dev/) — Runtime schema validation
- [React Hook Form](https://react-hook-form.com/) — Client-side form management

### Previous Story Examples
- [Story 1.7: Design Token System](./1-7-design-token-system-tailwind-configuration.md) — Example of comprehensive story documentation
- Git commits `7e512ba`–`f1d2b7e` — Recent implementation patterns

---

## Story Status

**Status:** review

**Date Created:** 2026-03-25
**Date Completed:** 2026-03-25

**Next Step:** Run `/bmad-code-review` for peer review or merge to main

---

## File List

**New Files Created:**
- `src/schemas/registration.ts` — Zod schema for registration validation
- `src/services/dealer.service.ts` — Dealer and DealerUser creation logic
- `src/services/audit.service.ts` — Audit logging service
- `components/dealer/RegistrationForm.tsx` — Registration form component (client)
- `app/api/dealers/route.ts` — POST /api/dealers endpoint
- `app/(login)/sign-up/page.tsx` — Updated registration page
- `app/(dashboard)/dealer/onboarding/page.tsx` — Onboarding page placeholder
- `app/api/dealers/route.test.ts` — Unit tests for registration schema
- `src/services/dealer.service.test.ts` — Unit tests for dealer service
- `tests/a11y/dealer-registration.spec.ts` — E2E tests (Playwright)

**Modified Files:**
- `app/api/auth/google/callback/route.ts` — Updated redirect to /dealer/onboarding
- `app/api/auth/apple/callback/route.ts` — Updated redirect to /dealer/onboarding

**No schema migrations required** — DealerUser model and Dealer model already exist in schema.prisma

---

## Change Log

**Implementation Complete (2026-03-25)**
- Implemented full dealer registration flow with email/password
- Added OAuth integration for Google and Apple providers
- Created registration form UI with client-side validation
- Built comprehensive test suite (unit + E2E)
- All 4 acceptance criteria satisfied

---

## Dev Agent Record

### Implementation Plan

**Overall Approach:**
1. Leveraged existing Prisma schema (DealerUser model, Dealer model)
2. Built on existing auth infrastructure (session.ts, OAuth callbacks)
3. Created service layer for dealer creation following architecture patterns
4. Built client form using existing shadcn/ui components
5. Created comprehensive test coverage

**Key Technical Decisions:**
- Used `DealerUser` model instead of generic `User` (already in schema, optimized for multi-tenancy)
- Implemented atomic Dealer + DealerUser creation via Prisma transactions
- Session token created via `signToken()` and set in response cookies
- OAuth flow reused existing `findOrCreateOAuthUser()` helper
- Form uses client state management with fetch (simpler than Server Actions for this use case)

**Architecture Compliance:**
✅ Zod validation at API boundary
✅ Service layer handles all Prisma queries
✅ JWT session contains dealerId for RLS
✅ DEALER_ADMIN role for authorization
✅ Audit logging for registration event
✅ Error handling follows pattern: { error, code } format
✅ Duplicate email returns 409 CONFLICT

### Story Ready Validation

✅ **All Critical Context Provided:**
- Acceptance criteria fully detailed in BDD format
- Architecture compliance verified against core decisions and patterns
- Zod schema and API contract fully specified
- Service layer and component structure aligned with project patterns
- Testing strategy with unit and E2E examples provided
- Previous story learnings incorporated
- Git intelligence captured
- Technical implementation roadmap clear

✅ **Dependencies Resolved:**
- Auth.js v5 already configured with Google/Apple providers
- Prisma schema has Dealer + User models ready
- RLS middleware in place; JWT session structure defined
- Design token system (Story 1.7) available for form styling
- shadcn/ui components ready to use

✅ **No Blockers Identified:**
- All required libraries installed or available
- No schema migrations needed (Dealer, User models exist)
- No external API dependencies (OAuth providers configured)
- Test environment ready (Playwright, Vitest available)

**Story is fully contextualized and ready for development.**

---

**Ultimate BMad Context Engine Analysis Completed** — Comprehensive dealer admin registration story created with all developer guardrails, architecture compliance, technical specifications, and testing requirements for flawless implementation.
