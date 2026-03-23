# Starter Template Evaluation

## Primary Technology Domain

Full-stack web application (Next.js SaaS) — stack confirmed by UX specification: Next.js + TypeScript + Tailwind CSS + shadcn/ui, deployed on Vercel.

## Starter Options Considered

1. **nextjs/saas-starter** (Official Vercel/Next.js) — Next.js 16.x, PostgreSQL + Drizzle, Stripe, shadcn/ui, JWT auth, basic team model. Current and actively maintained.
2. **ixartz/SaaS-Boilerplate** — Strong multi-tenancy and RBAC via Clerk, but Clerk is a paid dependency at scale and uses Next.js 14.
3. **mickasmt/next-saas-stripe-starter** — Solid feature set but no core updates since mid-2024; targets Next.js 14.

## Selected Starter: `nextjs/saas-starter`

**Rationale:** Official Next.js/Vercel template, current on Next.js 16.x, Stripe + shadcn/ui + Tailwind + JWT auth pre-configured. Aligns with every confirmed technical decision. The default Drizzle ORM is replaced with Prisma + Neon (see below). Gaps (OAuth, 4-role RBAC, full multi-tenancy) are well-understood extensions, not architectural replacements.

**Initialization Command:**

```bash
# Bootstrap from starter
npx degit nextjs/saas-starter jupiter
pnpm install

# Replace Drizzle with Prisma + Neon
pnpm remove drizzle-orm drizzle-kit
pnpm add prisma @prisma/client @neondatabase/serverless
npx prisma init
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript (strict), Node.js 20.9+, Next.js 16.2 App Router

**Styling Solution:** Tailwind CSS + shadcn/ui pre-configured with CSS variables; `components/ui/` directory ready for component additions

**Database & ORM:** PostgreSQL via **Neon** (serverless, connection pooling via `@neondatabase/serverless` — critical for Vercel's serverless function model). **Prisma** as the ORM — schema-first, strong migration tooling, excellent TypeScript types, well-suited for the complex multi-tenant data model. Neon's built-in PgBouncer-compatible pooler handles connection management at scale.

**Build Tooling:** Turbopack (default dev bundler in Next.js 16.x — faster HMR and `next dev` startup; no effect on production builds which continue to use webpack)

**Auth Foundation:** JWT-based session management with cookie storage; email/password login; to be extended with Auth.js for Google/Apple OAuth (FR1 requirement)

**Payments:** Stripe Checkout + Customer Portal + webhook handler with idempotency pattern pre-wired

**Code Organization:** `app/` (App Router pages/layouts), `components/` (ui + custom), `lib/` (db, auth, stripe utilities), `prisma/` (schema + migrations)

**Development Experience:** Turbopack fast refresh, `pnpm` workspace, `.env.local` configuration, Vercel preview deployments on every PR branch

**Note:** Project initialization using this starter should be the first implementation story. Drizzle → Prisma swap, OAuth extension (Auth.js), and the 4-role RBAC model are the first custom architectural additions after bootstrapping.
