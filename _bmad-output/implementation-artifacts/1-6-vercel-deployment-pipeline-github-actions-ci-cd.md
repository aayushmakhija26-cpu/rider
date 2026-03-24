# Story 1.6: Vercel Deployment Pipeline & GitHub Actions CI/CD

Status: in-progress

## Story

As a developer,
I want automated deployments to Dev / Preview / Prod Vercel environments and GitHub Actions quality gates on every PR,
so that code quality is enforced and production deploys are safe and reproducible.

## Acceptance Criteria

1. **Given** a PR is opened against `main` **When** the GitHub Actions workflow runs **Then** Prisma migration safety check, Vitest unit tests, and axe-core accessibility CI all pass before the PR can be merged
2. **Given** a PR branch is pushed **When** Vercel receives the Git update **Then** it creates a Preview deployment for that branch automatically
3. **Given** a change is merged to `main` **When** Vercel processes the new commit **Then** it triggers a Production deployment for the linked Vercel project
4. **Given** Development, Preview, and Production environments are configured **When** the app builds or runs in each environment **Then** the correct environment variables are used with no secrets shared across environments

## Tasks / Subtasks

- [x] Task 1: Establish a CI-safe command surface in `jupiter/` (AC: 1, 4)
  - [x] Add a top-level `packageManager` field in `jupiter/package.json` so GitHub Actions can use deterministic pnpm setup/caching
  - [x] Add explicit scripts for CI concerns instead of baking command chains directly into workflow YAML
  - [x] Keep all application commands running from `jupiter/`; the repository root only hosts workflow files and Vercel linkage metadata

- [x] Task 2: Implement a Prisma migration safety gate that does not depend on a live production database connection (AC: 1)
  - [x] Add a CI command that compares `jupiter/prisma/migrations/` against `jupiter/prisma/schema.prisma` and fails if schema changes exist without a matching migration
  - [x] Use Prisma production-safe commands only; do not run `prisma migrate dev` in CI
  - [x] Make the failure message obvious so reviewers know whether the fix is "generate migration" vs "repair workflow"

- [x] Task 3: Add automated accessibility CI with Playwright + axe-core for public routes (AC: 1)
  - [x] Install and configure Playwright test support in `jupiter/`
  - [x] Add `@axe-core/playwright`-based smoke tests for routes that do not require auth, at minimum `/`, `/pricing`, `/sign-in`, `/sign-up`, and `/unauthorized`
  - [x] Scope axe checks to WCAG A/AA tags and fail CI on violations
  - [x] Keep tests independent from external services and authenticated sessions

- [x] Task 4: Create GitHub Actions quality-gate workflows at repository root (AC: 1)
  - [x] Create `.github/workflows/` at the repository root, not inside `jupiter/`
  - [x] Add a PR workflow that checks out the repo, sets up pnpm + Node, installs dependencies from `jupiter/`, then runs migration safety, Vitest, and accessibility checks
  - [x] Give each job a unique, stable name so branch protection can require them unambiguously
  - [x] Use least-privilege workflow permissions unless a later step proves a broader permission is required

- [ ] Task 5: Wire the repository to Vercel's Git-based deployment model instead of duplicating deploys in Actions (AC: 2, 3, 4)
  - [x] Treat Vercel Git integration as the deployment engine for preview and production deployments
  - [x] Verify the linked Vercel project is the existing `jupiter` project from `.vercel/project.json`
  - [ ] Verify `main` is the production branch in Vercel project settings
  - [x] Document how "Dev" maps to Vercel's `Development` environment, and how Preview/Production values differ
  - [x] If branch-specific preview variables are needed later, use Vercel's preview-branch overrides instead of inventing separate variable names

- [x] Task 6: Document required manual platform configuration that code alone cannot enforce (AC: 1, 2, 3, 4)
  - [x] Add a deployment/CI runbook or update existing docs with the environment variable matrix, Vercel branch tracking expectations, and required GitHub branch protection settings
  - [x] Document the required status checks that must be marked mandatory on `main`
  - [x] Document which secrets belong in Vercel vs GitHub Actions, and avoid duplicating application secrets into GitHub unless the workflow truly needs them

- [ ] Task 7: Verify the full path from PR to production (AC: all)
  - [ ] Confirm the PR workflow passes on a feature branch
  - [ ] Confirm Vercel produces a Preview deployment for the branch/PR
  - [ ] Confirm merging to `main` produces a Production deployment
  - [ ] Confirm the app builds in each environment with the intended variable set and no cross-environment leakage

## Dev Notes

### Story Intent

This story is about **quality gates plus environment-safe deployment plumbing**, not about introducing a second deployment mechanism. Vercel should keep doing deployments from Git; GitHub Actions should prove the code is safe enough to merge.

### Current Repo Reality: Follow Code, Not Stale Planning Assumptions

- The live project root for the app is `jupiter/`, but GitHub workflow files must live at repository root in `.github/workflows/`
- The linked Vercel metadata already exists at `.vercel/project.json` and points to project `jupiter`
- The codebase currently uses **custom JWT auth** in `jupiter/lib/auth/session.ts`, not Auth.js
- The app currently uses top-level `jupiter/app/` and `jupiter/middleware.ts`, not the `src/app/` / `src/middleware.ts` layout described in parts of the architecture docs
- `jupiter/package.json` currently has `build`, `test`, `db:migrate`, and `db:generate`, but no dedicated CI, typecheck, or accessibility scripts
- There is currently **no repository-level `.github/workflows/` directory** for CI

### What Already Exists

| Existing asset | Location | Why it matters for this story |
|---|---|---|
| Vercel project linkage | `.vercel/project.json` | Confirms the repo is already linked to Vercel project `jupiter`; do not create a second deployment path |
| Current env var template | `jupiter/.env.example` | Source of truth for current app variables; use it to build the environment matrix |
| Vitest tests | `jupiter/lib/auth/session.test.ts`, `jupiter/src/lib/db.test.ts`, `jupiter/app/api/auth/_oauth-helpers.test.ts`, `jupiter/middleware.test.ts` | CI can already run unit tests; story should standardize how |
| Middleware + route rules | `jupiter/middleware.ts`, `jupiter/lib/auth/route-rules.ts` | Public routes for a11y smoke tests already exist |
| OAuth + Stripe routes | `jupiter/app/api/auth/*`, `jupiter/app/api/stripe/*` | Deployment docs must not break existing env expectations |

### Architecture Compliance and Drift Notes

- Follow the architecture's **intent** for Vercel + GitHub Actions + environment isolation, but follow the **actual repository structure and auth implementation** when deciding files and commands
- Do **not** restructure the app to match the architecture document during this story
- Do **not** install Auth.js/NextAuth to "match architecture"; Stories 1.3 through 1.5 established the custom JWT path
- Do **not** move `jupiter/middleware.ts` into `src/`

### GitHub Actions Requirements

- Workflow files belong at repository root: `.github/workflows/*.yml`
- All app commands should use `working-directory: jupiter`
- Use `actions/checkout@v6`
- Use `actions/setup-node@v6`
- Use pnpm-aware caching with `cache: 'pnpm'` and `cache-dependency-path: jupiter/pnpm-lock.yaml`
- Keep job names unique and stable because GitHub required status checks can become ambiguous if names collide
- Limit token permissions to `contents: read` unless a later step proves broader access is necessary

### Prisma Migration Safety Requirement

The acceptance criteria says "Prisma migration safety check," but this repo should avoid CI steps that mutate databases. The safest implementation path is:

- Compare `prisma/migrations` to `prisma/schema.prisma`
- Fail if the schema and migration history are out of sync
- Keep production application of migrations on `prisma migrate deploy`

Recommended direction:

```bash
pnpm prisma migrate diff --exit-code --from-migrations=prisma/migrations --to-schema=prisma/schema.prisma
```

Run it from `jupiter/`. This is a much better fit than `migrate dev` in CI.

### Accessibility CI Guardrails

- Use Playwright with `@axe-core/playwright`
- Scan only routes CI can load deterministically without seeded auth state
- Prefer public smoke coverage over brittle authenticated flows in this story
- Use WCAG A/AA tags:
  - `wcag2a`
  - `wcag2aa`
  - `wcag21a`
  - `wcag21aa`
- Keep the app boot path self-contained for CI, ideally via Playwright `webServer`

### Vercel Deployment Guardrails

- Do **not** use GitHub Actions to run `vercel deploy` for normal preview/production flow unless a later constraint forces it
- Vercel already supports Git-driven preview deployments for PR/non-production branches and production deployments for the production branch
- Story wording says "Dev / Preview / Prod"; in current Vercel terminology the built-in environments are `Development`, `Preview`, and `Production`
- "Dev" in this story should map to Vercel `Development` plus local `.env.local` pulled via `vercel env pull`
- If the team wants a persistent staging branch later, use Vercel preview-branch overrides or a custom environment, not ad hoc env var names

### Environment Variable Matrix

Use the same variable names across environments, but different values:

| Variable | Development | Preview | Production | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | Dev Neon/branch-safe DB | Preview DB | Prod DB | Never share prod DB with preview |
| `DIRECT_URL` | Dev direct DB URL | Preview direct DB URL | Prod direct DB URL | Migration-only connection |
| `AUTH_SECRET` | Dev secret | Preview secret | Prod secret | Must be unique per environment |
| `BASE_URL` | Localhost/dev URL | Preview deployment URL | Production domain | Needed by auth and Stripe flows |
| `STRIPE_SECRET_KEY` | Test key | Test/preprod key | Live key | Do not leak live keys into preview |
| `STRIPE_WEBHOOK_SECRET` | Local CLI secret | Preview webhook secret if used | Production webhook secret | Keep per-environment |
| `GOOGLE_CLIENT_ID/SECRET` | Dev OAuth app | Preview OAuth app or shared non-prod app | Prod OAuth app | Redirect URIs must match environment |
| `APPLE_*` | Dev/test values | Preview values | Prod values | Same rule as Google |

### Secrets Placement

- Application runtime secrets belong in Vercel environment variables
- GitHub Actions secrets should only exist if the workflow itself needs them
- If GitHub Actions only runs static checks/tests, avoid copying app secrets into GitHub entirely
- Branch protection and Vercel branch tracking are manual platform settings and must be documented, not "implemented" in code

### Testing Requirements

- CI must run from a clean install, not rely on local caches or untracked files
- Minimum verification commands for this story should include:
  - dependency install
  - Prisma migration safety check
  - `pnpm test`
  - accessibility smoke suite
- Optional but strongly recommended: include `pnpm build` in CI even though it is not named explicitly in the ACs, because deployment safety depends on a successful Next.js build

### Anti-Patterns to Avoid

- Do not put workflows in `jupiter/.github/`; GitHub will ignore them
- Do not trigger duplicate preview/prod deployments from both Vercel Git integration and GitHub Actions
- Do not use `prisma migrate dev` in CI
- Do not require authenticated dealer flows for the first version of a11y CI
- Do not hardcode environment-specific values in code or YAML
- Do not add broad GitHub token permissions "just in case"
- Do not assume the architecture doc's `src/app` layout is current
- Do not remove or rename current public routes just to satisfy tests

### Previous Story Intelligence

From Story 1.5 and current codebase:

- Route-rule ordering is load-bearing; public routes such as `/sign-in`, `/sign-up`, and `/unauthorized` are deliberate and good candidates for accessibility smoke tests
- The repo already has Vitest coverage patterns worth extending rather than replacing
- Current auth is custom JWT, so deployment validation should focus on existing env vars and session behavior, not a new auth stack
- Story 1.5's record shows this codebase already values explicit guardrails and exact file locations; continue that style here

### Git Intelligence Summary

- Git history is effectively empty for implementation pattern mining in this workspace (`git log -5 --oneline` only shows `3e06486 Initial commit`)
- The useful implementation context comes from the current uncommitted workspace and prior BMAD story artifacts, not historical commits

### Latest Technical Information

As of **2026-03-24**, official docs support the following decisions:

- Vercel Git deployments automatically create preview deployments for non-production branches/PRs and production deployments for the production branch
- Vercel environment variables are scoped to `Development`, `Preview`, and `Production`, with branch-specific preview overrides available
- `actions/setup-node@v6` supports pnpm dependency caching when configured explicitly
- `actions/checkout@v6` is the current major and recommends least-privilege permissions
- Playwright's accessibility guide recommends `@axe-core/playwright` and WCAG tag filtering for automated checks
- Prisma documents `migrate diff --exit-code` for sync checks and `migrate deploy` for production migration application

### Project Structure Notes

- This story must respect the split between repository root infrastructure files and the nested app:
  - Repo root: `.github/workflows/`, `.vercel/`, BMAD artifacts
  - App root: `jupiter/`
- If docs are added, prefer either:
  - repository root `docs/deployment-runbook.md`, or
  - targeted updates to `jupiter/README.md`
- Do not scatter CI scripts across both roots without reason

### References

- Epic story definition: [Source: `_bmad-output/planning-artifacts/epics/epic-1-foundation-developer-platform-setup.md#story-16-vercel-deployment-pipeline-github-actions-cicd`]
- CI/CD architecture intent: [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#infrastructure-deployment`]
- Repo structure guidance: [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#complete-project-directory-structure`]
- Consistency rules for handlers/tests/services: [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- Accessibility CI expectation: [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md#testing-strategy`]
- Current env vars: [Source: `jupiter/.env.example`]
- Current Vercel linkage: [Source: `.vercel/project.json`]
- Current scripts/dependencies: [Source: `jupiter/package.json`]
- Current auth and route rules: [Source: `jupiter/middleware.ts`, `jupiter/lib/auth/route-rules.ts`, `jupiter/lib/auth/session.ts`]
- Vercel Git deployments docs, last updated 2026-01-07: https://vercel.com/docs/git
- Vercel environment variables docs, last updated 2025-09-24: https://vercel.com/docs/environment-variables
- GitHub `actions/setup-node` README (`v6`, pnpm caching): https://github.com/actions/setup-node
- GitHub `actions/checkout` README/Marketplace (`v6`, recommended permissions): https://github.com/actions/checkout
- GitHub protected branches / required checks: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Playwright accessibility testing guide: https://playwright.dev/docs/next/accessibility-testing
- Prisma `migrate diff`: https://docs.prisma.io/docs/cli/migrate/diff
- Prisma `migrate deploy`: https://docs.prisma.io/docs/cli/migrate/deploy

## Dev Agent Record

### Agent Model Used

gpt-5

### Debug Log References

- No `project-context.md` file was present in the workspace
- `pnpm run ci:prisma` now expects `SHADOW_DATABASE_URL` so CI can use an ephemeral Postgres shadow database instead of a live production database
- Playwright accessibility smoke tests surfaced real regressions in viewport zoom, color contrast, and the public header `UserMenu`; those were fixed in this implementation
- Actual GitHub PR execution, Vercel Preview deployment creation, and Production deployment verification still require a real branch push and Vercel project access

### Completion Notes List

- Added deterministic pnpm metadata plus dedicated CI scripts for migration safety, unit tests, accessibility smoke tests, and production builds in `jupiter/package.json`
- Added `scripts/ci/prisma-migration-check.mjs` plus coverage for its reviewer-facing failure messaging, and wired the GitHub Actions migration job to an ephemeral Postgres shadow database service
- Added Playwright + `@axe-core/playwright` smoke coverage for `/`, `/pricing`, `/sign-in`, `/sign-up`, and `/unauthorized`, with CI-safe pricing mocks and a built-app web server path
- Fixed accessibility and public-route regressions uncovered during smoke testing: removed zoom-locking viewport settings, improved low-contrast orange text/button styles, hardened the public header `UserMenu`, and made the terminal snippet high-contrast
- Added `docs/deployment-runbook.md` describing environment scoping, required branch-protection checks, Vercel Git deployment expectations, and secrets placement guidance
- Story remains in progress until the external platform checks are performed: confirm `main` as the Vercel production branch, verify Preview deployment creation from a PR branch, and verify Production deployment after merging to `main`

### File List

- `.github/workflows/quality-gates.yml`
- `docs/deployment-runbook.md`
- `jupiter/package.json`
- `jupiter/pnpm-lock.yaml`
- `jupiter/playwright.config.ts`
- `jupiter/scripts/ci/prisma-migration-check.mjs`
- `jupiter/scripts/ci/prisma-migration-check.test.ts`
- `jupiter/tests/a11y/public-routes.spec.ts`
- `jupiter/lib/payments/stripe.ts`
- `jupiter/app/layout.tsx`
- `jupiter/app/(dashboard)/layout.tsx`
- `jupiter/app/(dashboard)/page.tsx`
- `jupiter/app/(dashboard)/terminal.tsx`
- `jupiter/app/(login)/login.tsx`
- `jupiter/app/(login)/unauthorized/page.tsx`

### Change Log

- 2026-03-24: Implemented CI/deployment infrastructure for Story 1.6, including repo-root GitHub Actions quality gates, Prisma migration safety scripting, Playwright + axe public-route smoke coverage, deployment runbook documentation, and related accessibility/public-header fixes. External GitHub/Vercel verification steps remain open.
