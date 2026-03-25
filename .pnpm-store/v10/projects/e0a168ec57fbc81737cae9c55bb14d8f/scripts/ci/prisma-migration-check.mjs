import { spawn } from 'node:child_process'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export function getPnpmExecutable() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
}

export function getShadowDatabaseUrl() {
  return process.env.SHADOW_DATABASE_URL ?? ''
}

export function buildFailureMessage(exitCode, output = '') {
  const details = output.trim()

  // Map of exit codes to remediation instructions
  const exitCodeMap = {
    2: {
      title: 'Prisma schema changes were detected without a matching committed migration.',
      remedy:
        'Reviewers should generate a migration, not edit the workflow.\n\n' +
        'Fix: run `pnpm prisma migrate dev --name <describe-change>` locally, then commit the updated `prisma/schema.prisma` and `prisma/migrations/` files.',
    },
    1: {
      title: 'Prisma migration check failed.',
      remedy:
        'This usually indicates a Prisma command execution error. Check the output above for details.',
    },
    124: {
      title: 'Prisma migration check timed out.',
      remedy:
        'The migration diff command took too long to complete. This may indicate:\n' +
        '- A large migration history causing slow diff computation\n' +
        '- Database locks or connectivity issues\n' +
        'Try running the command locally: `pnpm prisma migrate diff --from-migrations=prisma/migrations --to-schema=prisma/schema.prisma`',
    },
    126: {
      title: 'Permission denied running migration check.',
      remedy:
        'The workflow lacks permission to execute the migration check script. Ensure:\n' +
        '- The `prisma/migrations/` directory is readable\n' +
        '- The `prisma/schema.prisma` file is readable\n' +
        '- The pnpm/Prisma CLI has execute permissions',
    },
    127: {
      title: 'Prisma CLI not found.',
      remedy:
        'The Prisma command is not available in the CI environment. Ensure:\n' +
        '- Dependencies were installed: `pnpm install`\n' +
        '- Prisma is listed in `package.json` dependencies\n' +
        '- The Node environment is properly initialized',
    },
  }

  const codeInfo = exitCodeMap[exitCode] || {
    title: `Prisma migration check failed with exit code ${exitCode}.`,
    remedy: 'Inspect the output above and the workflow environment configuration.',
  }

  return [
    codeInfo.title,
    codeInfo.remedy,
    details ? `\nPrisma output:\n${details}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')
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
