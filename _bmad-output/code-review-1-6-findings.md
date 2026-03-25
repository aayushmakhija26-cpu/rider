# Code Review: Story 1.6 - Vercel Deployment Pipeline & GitHub Actions CI/CD

**Review Date:** 2026-03-25
**Review Method:** Parallel adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor)
**Status:** Critical and High issues require fixes before next deployment

---

## Critical Issues (Must Fix)

### 1. Status Contradiction Resolved
**Status:** ✅ FIXED
**Issue:** Story file showed `in-progress` while sprint-status.yaml showed `review` (opposite states)
**Fix Applied:** Both files now consistently show `review` status

---

## High-Priority Issues (AC Violations)

### 2. AC 4 Violation: CI Does Not Validate Real Environment Variables
**Severity:** HIGH
**Acceptance Criteria:** "the correct environment variables are used with no secrets shared across environments"
**Current Problem:** CI workflow uses hardcoded placeholder values (`sk_test_ci_placeholder`, `whsec_ci_placeholder`) instead of real Vercel environment variables. This means:
- CI tests pass even if Vercel environment variables are misconfigured
- A developer could accidentally swap database URLs between Preview and Production without CI catching it
- Secrets accidentally leaked between environments would not be detected

**Files Affected:**
- `.github/workflows/quality-gates.yml` (lines 91-106, 138-153)

**Remediation Options:**
1. **Option A (Recommended):** Use GitHub Actions environment secrets for each environment, and pass them to CI jobs
   - Requires: Setting up GitHub Actions environments and secrets
   - Benefit: CI validates real configuration, detects misconfigurations

2. **Option B:** Add a separate "configuration validation" job that queries Vercel API to verify environment variables are set correctly
   - Benefit: No need to store secrets in GitHub Actions
   - Trade-off: Requires Vercel API token, adds workflow complexity

**Priority:** Before next major deployment
**Story Assignment:** Create subtask "Validate environment variables in CI"

---

### 3. AC 2 Violation: Vercel Preview Deployment Not Verified by CI
**Severity:** HIGH
**Acceptance Criteria:** "Given a PR branch is pushed, When Vercel receives the Git update, Then it creates a Preview deployment for that branch automatically"
**Current Problem:** CI workflow runs and passes, but never confirms that Vercel actually created a Preview deployment. A Vercel configuration error could prevent preview creation while CI still passes.

**Files Affected:**
- `.github/workflows/quality-gates.yml` (missing Vercel verification step)

**Remediation:**
Add a CI job that polls the Vercel API to confirm Preview deployment was created before allowing PR merge:
```yaml
  verify-vercel-preview:
    runs-on: ubuntu-latest
    needs: [unit-tests, migration-check, accessibility-tests]
    steps:
      - name: Check Vercel Preview deployment
        run: |
          # Query Vercel API for this PR's preview deployment
          # Fail if not found or still building
```

**Priority:** Before next PR merge
**Story Assignment:** Create subtask "Add Vercel Preview verification to CI"

---

### 4. AC 4 Violation: Cross-Environment Secret Leakage Not Prevented
**Severity:** HIGH
**Acceptance Criteria:** "no secrets shared across environments"
**Current Problem:** CI uses identical placeholder values across all jobs. While placeholders aren't real secrets, this doesn't actually test that real environment variables are isolated. A developer could:
- Accidentally copy a Production secret into the Preview environment
- Use the same Stripe webhook secret for both Preview and Production
- Share the same database URL across environments

This would not be caught by current CI.

**Files Affected:**
- `.github/workflows/quality-gates.yml` (all job definitions use same placeholder values)

**Remediation:**
Implement proper secret rotation and environment-specific secrets:
1. Use GitHub Actions environments feature to scope secrets per environment
2. Add a CI step that validates: `STRIPE_SECRET_KEY != PREVIEW_STRIPE_SECRET_KEY` (if both exist)
3. Document in `docs/deployment-runbook.md` that each environment must have unique secrets

**Priority:** Before next major release
**Story Assignment:** Create subtask "Implement environment-specific secret validation"

---

## Medium-Priority Issues

### 5. Branch Protection Checks Not Automatically Enforced
**Severity:** MEDIUM
**Issue:** `docs/deployment-runbook.md` documents required status checks that "must be marked mandatory on `main`", but no automation enforces this configuration. A repo admin could accidentally disable branch protection.

**Remediation:**
```bash
# Add a GitHub API call to enforce branch protection in CI
gh api repos/{owner}/{repo}/branches/main/protection \
  --input protection-config.json
```

**Priority:** Before moving to next epic
**Story Assignment:** Create subtask "Automate GitHub branch protection configuration"

---

### 6. Unhandled Prisma Exit Codes
**Severity:** MEDIUM
**Issue:** `jupiter/scripts/ci/prisma-migration-check.mjs` only handles exit code 2 explicitly. Codes 3+ return a generic "repair the workflow" message, which doesn't help if the real issue is a timeout or permission error.

**Files Affected:**
- `jupiter/scripts/ci/prisma-migration-check.mjs` (line 20-35)

**Remediation:**
```javascript
const exitCodeMap = {
  0: "✓ Migrations in sync with schema",
  2: "✗ Schema and migrations are out of sync",
  124: "✗ Timeout: migration check took too long",
  126: "✗ Permission denied accessing migrations folder",
  127: "✗ Prisma CLI not found",
};
```

**Priority:** Next sprint
**Story Assignment:** Create subtask "Improve Prisma error messaging"

---

### 7. Playwright Port Hardcoded, Risk of Conflict
**Severity:** MEDIUM
**Issue:** `jupiter/playwright.config.ts` hardcodes port 3001 without dynamic fallback. Under concurrent CI runs or with lingering processes, port binding could fail.

**Files Affected:**
- `jupiter/playwright.config.ts` (line 31)

**Remediation:**
```typescript
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
// Or use 0 for automatic port selection, then discover via API
```

**Priority:** Next sprint (low-likelihood on GitHub-hosted runners)
**Story Assignment:** Create subtask "Add dynamic Playwright port selection"

---

### 8. SHADOW_DATABASE_URL Variable Inconsistency
**Severity:** MEDIUM
**Issue:** `quality-gates.yml` sets `SHADOW_DATABASE_URL`, but `prisma-migration-check.mjs` accepts both `SHADOW_DATABASE_URL` and `PRISMA_SHADOW_DATABASE_URL`. Local developers using the fallback variable will have different behavior than CI.

**Files Affected:**
- `.github/workflows/quality-gates.yml` (line X)
- `jupiter/scripts/ci/prisma-migration-check.mjs` (line 11)
- `jupiter/prisma.config.ts` (line 22)

**Remediation:**
Standardize on single variable name across all files:
```bash
# Option A: Use SHADOW_DATABASE_URL everywhere (shorter)
# Option B: Use PRISMA_SHADOW_DATABASE_URL everywhere (Prisma convention)
```

**Priority:** Next sprint
**Story Assignment:** Create subtask "Standardize shadow database variable naming"

---

### 9. Accessibility Test Route Coverage Not Validated
**Severity:** MEDIUM
**Issue:** CI runs `tests/a11y/public-routes.spec.ts` but doesn't verify that required routes (`/`, `/pricing`, `/sign-in`, `/sign-up`, `/unauthorized`) are actually tested. A future refactor could delete one of these tests, and CI wouldn't catch it.

**Files Affected:**
- `.github/workflows/quality-gates.yml` (accessibility-tests job)

**Remediation:**
```bash
# Add CI step to validate required routes are tested
grep -E "describe\('/' )|describe\('/pricing' )" tests/a11y/public-routes.spec.ts \
  || (echo "Missing required accessibility tests" && exit 1)
```

**Priority:** Next sprint
**Story Assignment:** Create subtask "Add accessibility test coverage validation"

---

### 10. Prisma Shadow Database Version Mismatch Risk
**Severity:** MEDIUM
**Issue:** CI uses `postgres:16` hardcoded, but production Neon database may use a different version. SQL syntax supported in PG16 might not work in PG14, and vice versa. This could cause:
- Migration check passes in CI but fails in production
- Type extensions available in one version but not the other

**Files Affected:**
- `.github/workflows/quality-gates.yml` (line 22: `postgres:16`)

**Remediation:**
1. Document which Postgres version Neon production runs
2. Update CI to match production version
3. Consider using Neon's GitHub Action for testing against live Neon API

**Priority:** Next sprint
**Story Assignment:** Create subtask "Align Postgres version in CI with production"

---

## Summary by Category

| Category | Count | Action |
|---|---|---|
| **Critical** | 1 | ✅ Fixed (status contradiction) |
| **High** | 3 | Must fix before next deployment (AC violations) |
| **Medium** | 6 | Fix in next sprint (quality & robustness) |
| **Deferred** | 1 | Postgres version (track for future) |

---

## Recommended Follow-Up Work

**Create Epic/Story:** "Story 1.6 Code Review Remediation"

**Subtasks:**
1. [ ] Validate real environment variables in CI (High)
2. [ ] Add Vercel Preview deployment verification (High)
3. [ ] Implement environment-specific secret isolation (High)
4. [ ] Automate GitHub branch protection configuration (Medium)
5. [ ] Improve Prisma error messaging (Medium)
6. [ ] Add dynamic Playwright port selection (Medium)
7. [ ] Standardize shadow database variable naming (Medium)
8. [ ] Add accessibility test coverage validation (Medium)
9. [ ] Align Postgres version in CI with production (Medium)

---

**Report Generated:** 2026-03-25
**Reviewed By:** Parallel adversarial review agents (Blind Hunter, Edge Case Hunter, Acceptance Auditor)
