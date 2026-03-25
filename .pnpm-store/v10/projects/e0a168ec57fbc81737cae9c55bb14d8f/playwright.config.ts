import { defineConfig } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT ?? '3001'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`
const command =
  process.platform === 'win32'
    ? 'cmd /c pnpm run ci:a11y:server'
    : 'pnpm run ci:a11y:server'

export default defineConfig({
  testDir: './tests/a11y',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      AUTH_SECRET:
        process.env.AUTH_SECRET ??
        'playwright-test-auth-secret-with-32-plus-characters',
      BASE_URL: process.env.BASE_URL ?? baseURL,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://test:test@127.0.0.1:5432/test?sslmode=disable',
      DIRECT_URL:
        process.env.DIRECT_URL ??
        'postgresql://test:test@127.0.0.1:5432/test?sslmode=disable',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
      STRIPE_WEBHOOK_SECRET:
        process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_mock',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'google-client-id',
      GOOGLE_CLIENT_SECRET:
        process.env.GOOGLE_CLIENT_SECRET ?? 'google-client-secret',
      APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID ?? 'apple-client-id',
      APPLE_TEAM_ID: process.env.APPLE_TEAM_ID ?? 'apple-team-id',
      APPLE_KEY_ID: process.env.APPLE_KEY_ID ?? 'apple-key-id',
      APPLE_PRIVATE_KEY:
        process.env.APPLE_PRIVATE_KEY ??
        '-----BEGIN PRIVATE KEY-----\\nplaywright\\n-----END PRIVATE KEY-----',
      PLAYWRIGHT_TEST: 'true',
    },
  },
})
