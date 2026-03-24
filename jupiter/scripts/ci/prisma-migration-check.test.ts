import { describe, expect, it } from 'vitest'

import {
  buildFailureMessage,
  getPnpmExecutable,
} from './prisma-migration-check.mjs'

describe('prisma migration check messaging', () => {
  it('guides reviewers to generate a migration when schema changes are missing one', () => {
    const message = buildFailureMessage(2, 'Some diff output')

    expect(message).toContain('generate a migration')
    expect(message).toContain('pnpm prisma migrate dev --name <describe-change>')
    expect(message).toContain('prisma/schema.prisma')
  })

  it('guides reviewers to inspect workflow setup when Prisma fails unexpectedly', () => {
    const message = buildFailureMessage(1, 'Unexpected failure')

    expect(message).toContain('repair the workflow')
    expect(message).toContain('Unexpected failure')
  })
})

describe('getPnpmExecutable', () => {
  it('returns a platform-appropriate pnpm executable', () => {
    expect(['pnpm', 'pnpm.cmd']).toContain(getPnpmExecutable())
  })
})
