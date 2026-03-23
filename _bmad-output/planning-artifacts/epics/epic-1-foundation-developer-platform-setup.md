# Epic 1: Foundation & Developer Platform Setup

The platform is initialized from the `nextjs/saas-starter` template, all infrastructure is configured (Prisma + Neon + RLS, Auth.js v5, 4-role RBAC, Vercel Dev/Preview/Prod, GitHub Actions CI/CD, Tailwind design tokens), and every technical layer is in place to enable all subsequent epics.

## Story 1.1: Project Bootstrap from Starter Template

As a developer,
I want to initialize the Jupiter project from the `nextjs/saas-starter` template with Prisma + Neon replacing Drizzle,
So that the team has a modern, production-ready Next.js 16 codebase with Stripe, shadcn/ui, Tailwind, and JWT auth pre-configured as the starting point.

**Acceptance Criteria:**

**Given** a fresh repository
**When** the initialization commands are run (`npx degit nextjs/saas-starter jupiter && pnpm install`, then Drizzle removed and Prisma + Neon added)
**Then** the app shell loads locally without errors, the default starter pages render, and `pnpm build` completes successfully
**And** Drizzle packages are absent from `package.json`; `prisma/schema.prisma` exists with a basic Neon datasource
**And** the app is deployed to Vercel Dev environment and accessible via a Vercel URL

---

## Story 1.2: Prisma Schema Foundation, Neon Database & Row-Level Security

As a developer,
I want the core Prisma schema (`Dealer`, `Consumer`, `User`) created with Neon as the database and Postgres RLS policies enforcing tenant isolation,
So that all future data access is multi-tenant-safe from day one.

**Acceptance Criteria:**

**Given** the project is bootstrapped
**When** `prisma migrate dev` is run
**Then** `Dealer`, `Consumer`, and `User` tables exist in Neon with `dealer_id` on all tenant-scoped tables
**And** Postgres RLS policies are applied; a test query from a connection without `app.current_dealer_id` set returns no rows
**And** Prisma client middleware injects `SET app.current_dealer_id` from the session on every connection

---

## Story 1.3: Email/Password Authentication & JWT Session Management

As a user,
I want to register and log in using email and password,
So that I have a secure, authenticated session with my role and dealer context embedded in the JWT.

**Acceptance Criteria:**

**Given** a user submits a valid email and password on the registration form
**When** the form is submitted
**Then** a new `User` record is created in Neon and a JWT session cookie (HTTP-only) is set containing `userId`, `role`, and `dealerId`
**And** the user is redirected to the appropriate route based on their role
**And** an invalid password on login returns an inline error without exposing whether the email exists

---

## Story 1.4: Google & Apple OAuth Integration

As a user,
I want to register and log in via Google or Apple,
So that I can access the platform without managing a password.

**Acceptance Criteria:**

**Given** a user clicks "Continue with Google" or "Continue with Apple"
**When** the OAuth flow completes successfully
**Then** an account is created or linked in Neon via the Auth.js Prisma adapter and a JWT session is established
**And** the user is redirected to their role-appropriate route
**And** if the OAuth email matches an existing email/password account, the accounts are merged (not duplicated)

---

## Story 1.5: 4-Role RBAC Middleware & Route Protection

As a platform,
I want Next.js middleware to enforce role-based route access for all four roles (`DEALER_ADMIN`, `DEALER_STAFF`, `CONSUMER`, `SYSADMIN`),
So that no user can access a route outside their role's permission set.

**Acceptance Criteria:**

**Given** a `DEALER_STAFF` user attempts to navigate to a `DEALER_ADMIN`-only route (e.g. billing settings)
**When** the route is resolved
**Then** the request is redirected to an unauthorized page — not a 404 or blank screen
**And** API Route Handlers perform a secondary role check and return `403` if the session role does not match the required permission
**And** a `CONSUMER` session cannot access any dealer or SysAdmin routes, and vice versa

---

## Story 1.6: Vercel Deployment Pipeline & GitHub Actions CI/CD

As a developer,
I want automated deployments to Dev / Preview / Prod Vercel environments and GitHub Actions quality gates on every PR,
So that code quality is enforced and production deploys are safe and reproducible.

**Acceptance Criteria:**

**Given** a PR is opened against `main`
**When** the GitHub Actions workflow runs
**Then** Prisma migration safety check, Vitest unit tests, and axe-core accessibility CI all pass before the PR can be merged
**And** Vercel creates a Preview deployment for the PR branch automatically
**And** merging to `main` triggers a production deploy to the Prod Vercel environment
**And** environment variables are correctly scoped (Dev / Preview / Prod) with no secrets shared across environments

---

## Story 1.7: Design Token System & Tailwind Configuration

As a developer,
I want the Jupiter design token system (color palette, typography, spacing) defined as CSS variables and Tailwind config extensions,
So that all components use consistent, semantically named tokens rather than hardcoded values.

**Acceptance Criteria:**

**Given** the Tailwind config and global CSS are updated
**When** a component references `text-financial-positive` or `bg-jupiter-blue`
**Then** the correct token value (`#059669` or `#2563EB`) is applied consistently across all surfaces
**And** financial state colours (positive/negative/caution) are defined as fixed semantic tokens that cannot be overridden by dealer theming
**And** `font-tabular` utility class is available for all financial value displays
**And** `prefers-reduced-motion` global CSS rule is in place

---
