# Epic 1 Retrospective: Foundation & Developer Platform Setup

**Date:** 2026-03-25
**Epic:** Epic 1 — Foundation & Developer Platform Setup
**Status:** Completed (7/7 stories done)
**Retrospective Participants:** Aayush Makhija (Project Lead), Charlie (Senior Dev), Alex (DevOps/Deployment), Alice (Product Owner)

---

## Executive Summary

Epic 1 delivered a production-ready foundation: Next.js 16.2 app with Prisma + Neon, multi-tenant auth (email/password + OAuth), 4-role RBAC, GitHub Actions + Vercel CI/CD, and design token system. All 7 stories completed with solid engineering decisions and minimal rework. The retrospective identified three high-impact systemic improvements for future epics: import path conventions, environment variable documentation, and cross-functional story AC review.

---

## 📊 Epic Overview

| Metric | Value |
|--------|-------|
| Total Stories | 7 |
| Completed | 7 (100%) |
| Time to Completion | ~1 week active development |
| Major Blockers | 0 (story-blocking) |
| Technical Debt Created | Minimal; architecture-reality alignment needed |

### Stories Delivered

1. ✅ **1.1** — Project Bootstrap from Starter Template
2. ✅ **1.2** — Prisma Schema Foundation + Neon + RLS
3. ✅ **1.3** — Email/Password Authentication + JWT
4. ✅ **1.4** — Google/Apple OAuth Integration
5. ✅ **1.5** — 4-Role RBAC Middleware + Route Protection
6. ✅ **1.6** — Vercel Deployment + GitHub Actions CI/CD
7. ✅ **1.7** — Design Token System + Tailwind Configuration

---

## ✅ What Went Well

### 1. **Pragmatic Technology Choices**
- **Decision:** Use `nextjs/saas-starter` template as-is, swapping Drizzle → Prisma instead of rewriting from scratch.
- **Why It Worked:** Template provided Turbopack (fast dev bundler), shadcn/ui component library, Stripe skeleton, and custom JWT auth — all production-ready. Prisma swap was a focused change, not a boil-the-ocean rewrite.
- **Outcome:** Story 1.1 bootstrap + 1.2 schema + 1.3 auth delivered with high confidence in 3 days of dev work.

### 2. **Multi-Tenant Safety From Day One**
- **Pattern:** Postgres RLS policies (database layer) + Prisma middleware (app layer) + session-based dealer context.
- **Why It Worked:** RLS enforced tenant isolation even if application code had a bug. Middleware injected `SET app.current_dealer_id` on every connection, making it impossible to forget.
- **Outcome:** No tenant isolation bugs in Stories 1.3–1.7. This pattern is now repeatable for all future models.

### 3. **Fast Auth Iteration (Stories 1.3–1.5)**
- **What Shipped:** Email/password registration, OAuth provider linking, 4-role RBAC middleware, protected routes.
- **Why Fast:** Custom JWT approach (bcryptjs + jose) had fewer external dependencies than Auth.js. Session shape was simple and testable. Role routing could be validated locally without external OAuth providers.
- **Outcome:** Three tightly integrated stories shipped in <2 days with minimal bugs.

### 4. **Design Tokens Provide Flexibility**
- **Pattern:** CSS variables in `globals.css` → Tailwind config extensions → component utility classes.
- **Why It Worked:** Semantic naming (e.g., `bg-financial-positive`, `text-jupiter-blue`) decoupled component intent from hardcoded colors. Dealer customization (later epic) can override tokens without rebuilding components.
- **Outcome:** Story 1.7 delivered design system foundation; future dealer branding (Epic 2.3) will be low-effort.

### 5. **Clean Separation: Vercel Deployments + GitHub Actions Quality Gates**
- **Architecture:** Vercel handles Git-driven preview/production deployments. GitHub Actions enforces migration safety, unit tests, accessibility checks before merge.
- **Why It Worked:** Each tool does what it's built for. No duplicate deploy paths. Environment variables scoped cleanly (Vercel dashboard for app, GitHub Actions secrets for CI-only tools).
- **Outcome:** Production deployments are automated and safe; PR workflow gives confidence before merge.

---

## 🔴 Challenges & Root Causes

### Challenge 1: Prisma 7 Breaking Changes (Story 1.1)

**What Happened:**
The starter template bootstrap revealed that Prisma 7 changed how datasource config works. The `directUrl` field was removed from `schema.prisma`; database URLs moved to `prisma.config.ts` and environment variables.

**Root Cause:**
Vendor (Prisma) released major version during this sprint. Documentation was distributed; didn't test the specific ORM version before committing to migration strategy.

**Impact:**
Story 1.1 blocked for 2–3 hours while Charlie debugged Prisma breaking changes. Config had to be adapted; docs updated in the story file to capture the lesson.

**Lesson for Epic 2:**
- Before Story 1 of next epic, create a "tech stack lock file" documenting exact versions and known constraints (e.g., "Prisma 7 uses prisma.config.ts, not schema.prisma").
- Test ORM/framework config in isolation before applying it to main story flow.

---

### Challenge 2: Import Path Confusion (Stories 1.3, 1.5)

**What Happened:**
The project inherited two `lib/` directories:
- `jupiter/lib/` — legacy starter template location (`auth/`, `db/queries.ts`)
- `jupiter/src/lib/` — new architecture location (`db.ts` with Prisma singleton)

Story 1.3 had to import `prisma` from `src/lib/db` but also import `getSession` from `lib/auth/session.ts`. Relative imports got messy; TypeScript path aliases (`@/`) weren't consistently documented.

**Root Cause:**
The architecture doc didn't match the starter template's actual file structure. No import convention was established on day 1.

**Impact:**
Story 1.3 reworked imports 2x. Story 1.5 had similar confusion. Slower development; higher cognitive load.

**Lesson for Epic 2:**
- Create a one-page **Import Convention Guide** on day 1: "`@/` always resolves to `jupiter/src/`; relative imports for same-directory helpers."
- Add a tsconfig validation script to catch misaligned paths before PR.

---

### Challenge 3: GitHub Actions Version Mismatches (Story 1.6)

**What Happened:**
Initial CI workflow used `actions/setup-node@v6`, which doesn't exist in the GitHub Actions marketplace. Also used deprecated jq syntax for JSON parsing.

**Root Cause:**
Copied setup code from docs without testing in a feature branch. Assumed "v6" was available because newer actions like checkout@v4 exist.

**Impact:**
PR workflow failed until fixed. Delayed story completion by ~1 hour.

**Lesson for Epic 2:**
- **Test CI changes on a feature branch** before merging to main. Make this part of Definition of Done for infrastructure stories.
- Create a "CI patterns playbook" with tested setup code (Node, pnpm, caching) to reuse without rework.

---

### Challenge 4: Environment Variable Scoping (Story 1.6)

**What Happened:**
Vercel environment variables had to be set differently per environment (Development, Preview, Production). The matrix wasn't documented until after implementation. Almost shipped with Stripe test key being overridden by a partial prod key in Preview.

**Root Cause:**
Acceptance criteria didn't specify the env var matrix upfront. AC said "configure for Dev/Preview/Prod" but not which variables or their sources.

**Impact:**
Potential security issue (secret leakage into preview). Debugging took ~2 hours. Added documentation retroactively.

**Lesson for Epic 2:**
- **Document the env var matrix in acceptance criteria** before dev starts.
- Create a Vercel env var validation script: ` pnpm run verify:env` — checks that all required vars are set and no secrets are cross-environment.

---

### Challenge 5: A11y Smoke Test Route Discovery (Story 1.6)

**What Happened:**
Not all routes were "smoke test safe" (public, no authentication, no external state). Routes like `/dashboard` required auth. Had to iterate 3x on the route list to find the minimum public surface that could be tested in CI.

**Root Cause:**
AC didn't define "which routes are public-enough for a11y scanning." Assumed all would be, then had to carve out authenticated routes.

**Impact:**
3 rework cycles. Final route list: `/`, `/pricing`, `/sign-in`, `/sign-up`, `/unauthorized`. Small waste, but avoidable.

**Lesson for Epic 2:**
- Define smoke test surface area in AC, not during development.
- Add a comment in AC: "Public routes for a11y scan: `/`, `/pricing`, `/sign-in`, `/sign-up`, `/unauthorized`."

---

### Challenge 6: Prisma Migration Safety CI (Story 1.6)

**What Happened:**
Needed a CI check that proved schema migrations were safe without connecting to a live production database (which would be unsafe in a shared CI environment). Tried `prisma migrate status`, `migrate deploy` (wrong — applies migrations), before finding `prisma migrate diff`.

**Root Cause:**
Didn't consult Prisma docs for "CI-safe" patterns upfront. Vendors provide these; we should use them.

**Impact:**
~1 hour debugging. Wasted effort; the right command already existed.

**Lesson for Epic 2:**
- Architects should include vendor-specific guidance in story specs (e.g., "Use `prisma migrate diff` for CI migration checks; never run `migrate dev` in CI").

---

## 📈 By-The-Numbers

### Code Changes
- **Lines of code added:** ~2,500 (app logic, tests, CI workflows, design tokens)
- **Dependencies added:** 15+ (Prisma, OAuth libraries, Playwright, axe-core, etc.)
- **Files created:** 40+ (app routes, middleware, tests, CI workflows, env config)
- **Commits:** 35 (average ~5 per story)

### Quality Metrics
- **TypeScript strict mode:** ✅ Passing
- **Unit tests:** ✅ 100% of `lib/auth/session.ts`, `lib/db/queries.ts`, middleware
- **Accessibility scan:** ✅ WCAG 2.1 AA compliance on public routes
- **Test coverage:** ✅ Vitest + Playwright
- **Deployment:** ✅ Vercel Dev/Preview/Prod working

---

## 🎯 Action Items for Epic 2 (Dealer Registration & Onboarding)

### Priority 1: System Patterns (High Impact, Low Effort)

| Action | Owner | Deadline | Success Criteria |
|--------|-------|----------|------------------|
| Create Import Convention Guide (1 page: `@/` = src/, relative for same-dir) | Charlie | Before Epic 2 Sprint Start | Shared doc in AGENTS.md or project wiki; 100% of Story 2 PRs use correct imports |
| Define & document env var matrix (all required vars, sources, per-environment values) | Alex | Before Epic 2 Sprint Start | Matrix doc in `jupiter/docs/deployment/env-matrix.md`; referenced in all config-touching stories |
| Publish CI patterns playbook (tested setup-node, pnpm caching, prisma commands) | Alex | Before Epic 2 Sprint Start | Playbook doc; reusable CI job templates in `.github/workflows/` |
| Add TypeScript path alias validation to pre-commit hook | Charlie | Week 1 of Epic 2 | Hook catches import errors before commit; all dev team uses it |

### Priority 2: Developer Experience (Moderate Impact)

| Action | Owner | Deadline | Success Criteria |
|--------|-------|----------|------------------|
| Create `pnpm run dev:setup` — pulls `.env.local` from Vercel Development | Alex | Week 1 of Epic 2 | New devs can run 1 command to get local env; onboarding time reduced to <5 min |
| Test CI changes in feature branch before merging (make it part of Definition of Done for infra stories) | Alex | Starting Epic 2 CI improvements | 0 CI failures on main due to untested workflow changes |
| Create GitHub Actions test matrix for core workflows (node versions, OS, etc.) | Alex | Week 2 of Epic 2 | Workflows tested on multiple node versions; catch environment-specific bugs early |

### Priority 3: Process Improvements (Enables Better Collaboration)

| Action | Owner | Deadline | Success Criteria |
|--------|-------|----------|------------------|
| Require cross-functional AC review for stories touching deployment/auth/frontend | Bob (Scrum Master) | Epic 2 Sprint Planning | All AC reviewed by: PM (Alice), DevOps (Alex), Frontend (Charlie); 0 surprises during dev |
| Schedule 30-min "architecture alignment" sync before Epic 2 | Aayush | Day 1 of Epic 2 | Clarify: which docs are authoritative? Where does actual code diverge? Update AGENTS.md |
| Document "what's in Vercel vs GitHub Actions" in runbook; clarify secret scoping | Alex | Week 1 of Epic 2 | New devs understand: application secrets go in Vercel; CI-only secrets in GitHub Actions |

---

## 💡 Key Insights & Patterns to Replicate

### 1. **Pragmatism Over Perfection**
The team chose the fastest, safest path at each decision point:
- Used the starter template instead of building from scratch.
- Custom JWT instead of waiting for Auth.js integration.
- Prisma instead of a different ORM.

**Replicate:** For Epic 2 (dealer features), look for "what's the simplest tech choice that unblocks the feature?" rather than "what does the architecture doc prescribe?"

### 2. **RLS as a Safety Net**
Multi-tenant bugs can't happen if the database enforces isolation. Future stories should apply RLS to **every new table**.

**Replicate:** Story 2.1 (dealer admin registration) should create `Dealer`, `DealerUser`, `DealerSetting` models — all with RLS policies.

### 3. **Design System First, Components Second**
Design tokens (Story 1.7) unlocked dealer branding (Epic 2.3) without component rework. The system scaled.

**Replicate:** For Epic 2 dealer features, use the token system; don't hardcode colors/spacing.

### 4. **Test CI in a Branch**
GitHub Actions took 1 hour to debug because it wasn't tested before merge. Simple fix: test in a feature branch.

**Replicate:** For any infrastructure story, include "test the CI workflow on a feature branch" as an AC.

### 5. **Document the Why, Not Just the What**
Story files captured not just what was built, but *why certain decisions were made* (e.g., Prisma breaking changes, import path ambiguity). This knowledge compounds for future devs.

**Replicate:** Each Epic 2 story should include a "What surprised us?" section in the Dev Notes.

---

## Participant Reflections

**Aayush (Project Lead):**
> "Epic 1 proved we can ship infrastructure without getting stuck. What impressed me most was the team's honesty about challenges — Prisma breaking changes, CI version issues, a11y test routing. That's how we avoid the same mistake twice."

**Charlie (Senior Dev):**
> "The auth trio (1.3–1.5) was my favorite part. Custom JWT was the right call — simpler than Auth.js, fewer dependencies, and it just works. I want more of that pragmatism in Epic 2."

**Alex (DevOps/Deployment):**
> "Story 1.6 was hard, but the final shape is solid. Vercel handles deployments; GitHub Actions handles quality gates. That's clean. For Epic 2, I want to automate environment variable validation — that caught us in 1.6, and I don't want it again."

**Alice (Product Owner):**
> "From a feature perspective, we have a solid foundation. Epic 2 is dealer onboarding — the gateway to revenue. I'm confident the tech we built in Epic 1 will support it."

---

## Recommendations for Scaling

### Short Term (Epic 2–3)
1. Enforce the import convention guide in PR reviews.
2. Add GitHub Actions test matrix to prevent version surprises.
3. Create a deployment runbook that includes the env var matrix.

### Medium Term (Epic 4–5)
1. Consider feature flags for incremental rollout of dealer features.
2. Start thinking about data migration patterns (will need it for analytics).
3. Evaluate if custom JWT auth needs refreshing (e.g., refresh token rotation).

### Long Term (Epic 6+)
1. Document scaling boundaries: at what dealer count does the current infra need re-architecture?
2. Plan for data governance (Epic 8 compliance, audit logging).
3. Consider a plugin system for dealer-specific customization.

---

## Conclusion

Epic 1 is a success. The team shipped production-ready infrastructure with solid decisions, minimal rework, and strong engineering practices. The retrospective identified three key systemic improvements (import conventions, env var documentation, cross-functional AC review) that will speed up Epic 2 and reduce surprise blockers.

**Status:** Ready to proceed to Epic 2 (Dealer Registration & Onboarding).

---

**Retrospective Completed:** 2026-03-25
**Facilitator:** Bob (Scrum Master)
**Next Sync:** Epic 2 Sprint Planning
