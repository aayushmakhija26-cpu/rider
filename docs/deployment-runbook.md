# Deployment and CI Runbook

## Purpose

This repository uses GitHub Actions for merge-quality gates and Vercel Git integration for deployments. GitHub Actions should prove a change is safe to merge. Vercel should remain the only system that creates Preview and Production deployments.

## Repository and Project Mapping

- Application root: `jupiter/`
- Repository root infrastructure files: `.github/workflows/`, `.vercel/`, `_bmad-output/`
- Linked Vercel project: `jupiter` from `.vercel/project.json`
- Production branch in Vercel: `main`

## Environment Model

- `Development`: local development plus `vercel env pull`
- `Preview`: every non-`main` Git branch or pull request deployment
- `Production`: the `main` branch deployment

Use the same variable names in every environment, but keep the values isolated per environment.

| Variable | Development | Preview | Production | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Development Neon branch | Preview database | Production database | Never point Preview at production data |
| `DIRECT_URL` | Development direct DB URL | Preview direct DB URL | Production direct DB URL | Reserved for migrations and schema tools |
| `AUTH_SECRET` | Development-only secret | Preview-only secret | Production-only secret | Must be unique per environment |
| `BASE_URL` | `http://localhost:3000` or local tunnel | Preview deployment URL | Production domain | Auth and Stripe callbacks depend on this |
| `STRIPE_SECRET_KEY` | Test key | Test or pre-production key | Live key | Never reuse live keys in Preview |
| `STRIPE_WEBHOOK_SECRET` | Local Stripe CLI secret | Preview webhook secret if used | Production webhook secret | Keep values isolated |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Local OAuth app | Preview OAuth app or shared non-prod app | Production OAuth app | Redirect URIs must match the environment URL |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | Local or test Apple credentials | Preview Apple credentials | Production Apple credentials | Keep callback URLs environment-specific |

## Secrets Placement

- Put runtime application secrets in Vercel Environment Variables.
- Do not copy real app secrets into GitHub Actions unless a workflow step truly requires them.
- The current workflow only uses non-secret placeholder values so it can build and smoke-test public routes.
- If a future workflow needs a real secret, add the minimum required secret to GitHub Actions and document why.

## GitHub Actions Secrets

### VERCEL_TOKEN (Optional but Recommended)

The CI workflow includes optional Vercel API verification jobs that require a `VERCEL_TOKEN` GitHub Actions secret:

- **Job:** `verify-vercel-preview` — Polls the Vercel API to confirm a Preview deployment reaches `Ready` state before allowing the PR to merge. This ensures AC 2 is actually verified.
- **Job:** `verify-vercel-env-config` — Calls the Vercel API to confirm all required environment variable keys are present in the Vercel project.

**Without this token:**
- Both jobs skip gracefully (no CI failure) with a warning message
- You lose automated verification that Vercel deployments actually succeed
- You should manually verify Preview deployments in the Vercel UI until the token is configured

**To set up:**

1. Create a Vercel token with limited scope:
   ```bash
   # Go to https://vercel.com/account/tokens
   # Create a token with scope: project.read (for API inspection)
   # Copy the token value
   ```

2. Add to GitHub Actions secrets:
   ```bash
   gh secret set VERCEL_TOKEN --body "<paste-token-value>"
   ```

   Or via GitHub UI:
   - Go to your repository Settings → Secrets and Variables → Actions
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: your Vercel token
   - Click "Add secret"

3. The next PR will automatically run the Vercel verification jobs

## Required GitHub Status Checks on `main`

Mark these checks as required in GitHub branch protection for `main`:

- `Quality Gates / Prisma migration safety`
- `Quality Gates / Vitest unit tests`
- `Quality Gates / Accessibility smoke tests`
- `Quality Gates / Next.js production build`

Recommended branch protection settings:

- Require a pull request before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Restrict force pushes to administrators only, if at all

## Required Manual Vercel Configuration

1. Confirm the Git repository is linked to the existing `jupiter` Vercel project.
2. Confirm `main` is set as the Production Branch in Vercel project settings.
3. Add the full environment matrix in Vercel for `Development`, `Preview`, and `Production`.
4. If a preview branch needs special values later, use Vercel preview-branch overrides instead of inventing new variable names.
5. Use `vercel env pull` for local development so `Development` values stay aligned with the Vercel project.

## Pull Request to Production Flow

1. Push a feature branch and open a pull request to `main`.
2. GitHub Actions runs the four quality gate jobs from `.github/workflows/quality-gates.yml`.
3. Vercel creates a Preview deployment automatically for the branch or pull request.
4. Review the Preview deployment and ensure environment-specific behavior is correct.
5. Merge to `main` only after all required checks pass.
6. Vercel creates the Production deployment from `main`.

## Verification Checklist

- Pull request checks pass with no manual retries
- Preview deployment appears in Vercel for the branch or PR
- Preview uses Preview-scoped environment values
- Production deployment triggers only from `main`
- Production uses Production-scoped environment values
- No live secrets are duplicated into GitHub Actions unnecessarily
