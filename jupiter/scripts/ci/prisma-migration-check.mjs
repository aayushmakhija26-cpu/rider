import { spawn } from 'node:child_process'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export function getPnpmExecutable() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
}

export function getShadowDatabaseUrl() {
  return (
    process.env.SHADOW_DATABASE_URL ??
    process.env.PRISMA_SHADOW_DATABASE_URL ??
    ''
  )
}

export function buildFailureMessage(exitCode, output = '') {
  const details = output.trim()

  if (exitCode === 2) {
    return [
      'Prisma schema changes were detected without a matching committed migration.',
      'Reviewers should generate a migration, not edit the workflow.',
      'Fix: run `pnpm prisma migrate dev --name <describe-change>` locally, then commit the updated `prisma/schema.prisma` and `prisma/migrations/` files.',
      details ? `Prisma output:\n${details}` : null,
    ].filter(Boolean).join('\n\n')
  }

  return [
    'Prisma migration safety check failed unexpectedly.',
    'This usually means you should repair the workflow or Prisma command setup rather than generate a new migration.',
    'Inspect the CI environment, Prisma CLI availability, and the migration check command before retrying.',
    details ? `Prisma output:\n${details}` : null,
  ].filter(Boolean).join('\n\n')
}

export async function runPrismaMigrationCheck({
  spawnImpl = spawn,
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  const shadowDatabaseUrl = getShadowDatabaseUrl()

  if (!shadowDatabaseUrl) {
    const error = new Error(buildFailureMessage(
      1,
      'Missing SHADOW_DATABASE_URL. Configure an ephemeral Postgres database for prisma migrate diff.'
    ))
    error.exitCode = 1
    throw error
  }

  const child = spawnImpl(getPnpmExecutable(), [
    'exec',
    'prisma',
    'migrate',
    'diff',
    '--exit-code',
    '--from-migrations=prisma/migrations',
    '--to-schema=prisma/schema.prisma',
  ], {
    cwd: process.cwd(),
    env: process.env,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  let output = ''

  child.stdout?.on('data', (chunk) => {
    const text = chunk.toString()
    output += text
    stdout.write(text)
  })

  child.stderr?.on('data', (chunk) => {
    const text = chunk.toString()
    output += text
    stderr.write(text)
  })

  await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        stdout.write('Prisma schema and migration history are in sync.\n')
        resolve()
        return
      }

      const error = new Error(buildFailureMessage(code ?? 1, output))
      error.exitCode = code ?? 1
      reject(error)
    })
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPrismaMigrationCheck().catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exit(error?.exitCode ?? 1)
  })
}
