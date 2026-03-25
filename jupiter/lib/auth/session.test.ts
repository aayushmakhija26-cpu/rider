import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Role } from '@prisma/client'

// Must stub env BEFORE importing session functions — jose SignJWT requires AUTH_SECRET
vi.stubEnv('AUTH_SECRET', 'test-secret-that-is-at-least-32-characters-long-for-hs256-signing')

// Mock next/headers (cookies() is server-only)
const mockCookiesStore = {
  get: vi.fn(() => undefined as { name: string; value: string } | undefined),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookiesStore),
}))

import { hashPassword, comparePasswords, signToken, verifyToken, requireAuth, AuthError } from './session'

describe('password hashing', () => {
  it('hashes and verifies a correct password', async () => {
    const hash = await hashPassword('mypassword123')
    expect(await comparePasswords('mypassword123', hash)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('mypassword123')
    expect(await comparePasswords('wrongpassword', hash)).toBe(false)
  })
})

describe('JWT signing and verification', () => {
  const payload = {
    userId: 'cuid123',
    role: 'DEALER_ADMIN' as Role,
    dealerId: 'dealer456',
    expires: new Date(Date.now() + 86400000).toISOString(),
  }

  it('signs and verifies a valid token', async () => {
    const token = await signToken(payload)
    const verified = await verifyToken(token)
    expect(verified.userId).toBe('cuid123')
    expect(verified.role).toBe('DEALER_ADMIN')
    expect(verified.dealerId).toBe('dealer456')
  })

  it('throws on invalid token', async () => {
    await expect(verifyToken('not-a-valid-token')).rejects.toThrow()
  })
})

describe('requireAuth', () => {
  const makeSession = async (role: Role) =>
    signToken({
      userId: 'user1',
      role,
      dealerId: 'dealer1',
      expires: new Date(Date.now() + 86400000).toISOString(),
    })

  beforeEach(() => {
    mockCookiesStore.get.mockReturnValue(undefined)
  })

  it('throws AuthError UNAUTHORIZED when no session cookie', async () => {
    const error = await requireAuth(['DEALER_ADMIN']).catch(e => e)
    expect(error).toBeInstanceOf(AuthError)
    expect(error.code).toBe('UNAUTHORIZED')
  })

  it('throws AuthError FORBIDDEN when role not in allowedRoles', async () => {
    const token = await makeSession('DEALER_STAFF' as Role)
    mockCookiesStore.get.mockReturnValue({ name: 'session', value: token })

    const error = await requireAuth(['DEALER_ADMIN']).catch(e => e)
    expect(error).toBeInstanceOf(AuthError)
    expect(error.code).toBe('FORBIDDEN')
  })

  it('returns SessionData when role is in allowedRoles', async () => {
    const token = await makeSession('DEALER_ADMIN' as Role)
    mockCookiesStore.get.mockReturnValue({ name: 'session', value: token })

    const session = await requireAuth(['DEALER_ADMIN', 'DEALER_STAFF'])
    expect(session.userId).toBe('user1')
    expect(session.role).toBe('DEALER_ADMIN')
  })

  it('allows CONSUMER role when included in allowedRoles', async () => {
    const token = await makeSession('CONSUMER' as Role)
    mockCookiesStore.get.mockReturnValue({ name: 'session', value: token })

    const session = await requireAuth(['DEALER_ADMIN', 'DEALER_STAFF', 'CONSUMER'] as Role[])
    expect(session.role).toBe('CONSUMER')
  })

  it('throws FORBIDDEN when CONSUMER tries DEALER_ADMIN-only route', async () => {
    const token = await makeSession('CONSUMER' as Role)
    mockCookiesStore.get.mockReturnValue({ name: 'session', value: token })

    const error = await requireAuth(['DEALER_ADMIN']).catch(e => e)
    expect(error).toBeInstanceOf(AuthError)
    expect(error.code).toBe('FORBIDDEN')
  })

  it('allows SYSADMIN role when included in allowedRoles', async () => {
    const token = await makeSession('SYSADMIN' as Role)
    mockCookiesStore.get.mockReturnValue({ name: 'session', value: token })

    const session = await requireAuth(['SYSADMIN'] as Role[])
    expect(session.role).toBe('SYSADMIN')
  })
})
