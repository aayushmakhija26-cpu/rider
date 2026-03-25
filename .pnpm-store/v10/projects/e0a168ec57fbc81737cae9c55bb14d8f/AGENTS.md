# Rider — AI Agent Instructions

## Project Name
Rider (Vercel project display name)

## Stack Summary
- **Framework:** Next.js 15.6 (App Router), TypeScript strict mode
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database ORM:** Prisma v7 + Neon (PostgreSQL serverless)
- **Auth:** JWT sessions via `jose` + HTTP-only cookies
- **Payments:** Stripe (Checkout, Customer Portal, webhooks)
- **Background Jobs:** Inngest (added in Story 3+)
- **Email:** Resend + React Email (added in Story 5+)
- **Caching:** Upstash Redis (added in Story 4+)
- **Deployment:** Vercel

## Default Routing Convention
Next.js 15.2+ App Router is the default. All pages use the App Router pattern:
- Route groups: `(consumer)`, `(dealer)`, `(sysadmin)` — scaffolded in later stories
- Server Components by default; add `'use client'` only when needed

## Key Project Directories
- `jupiter/` — Next.js project root
- `prisma/schema.prisma` — Database schema (models added from Story 1.2)
- `src/lib/db.ts` — Prisma client singleton
- `lib/auth/` — JWT session management and middleware
- `lib/payments/` — Stripe integration
- `app/(dashboard)/` — Dashboard routes (team management, pricing)
- `app/(login)/` — Auth routes (sign-in, sign-up)

## Development Notes
- Run `pnpm dev` in the `jupiter/` directory
- Run `pnpm build` to check for TypeScript errors
- No unit test framework yet (added in Story 1.2+)
- Auth/DB features are stubs in Story 1.1 — fully implemented in Stories 1.2–1.6
