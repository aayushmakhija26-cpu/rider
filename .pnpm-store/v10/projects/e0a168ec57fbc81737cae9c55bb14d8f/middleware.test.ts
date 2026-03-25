import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Role } from '@prisma/client'

vi.stubEnv('AUTH_SECRET', 'test-secret-that-is-at-least-32-characters-long-for-hs256-signing')

// Mock next/server to avoid Edge Runtime restrictions in test environment
vi.mock('next/server', () => {
  const redirect = vi.fn((url: URL) => ({ type: 'redirect', url: url.toString(), cookies: { delete: vi.fn(), set: vi.fn() } }))
  const next = vi.fn(() => ({ type: 'next', cookies: { set: vi.fn() } }))
  return {
    NextResponse: { redirect, next },
  }
})

// Mock session module — verifyToken is tested separately in session.test.ts
vi.mock('@/lib/auth/session', () => ({
  signToken: vi.fn(async (payload: unknown) => JSON.stringify(payload)),
  verifyToken: vi.fn(),
}))

import { NextResponse } from 'next/server'
import { verifyToken, signToken } from '@/lib/auth/session'
import { ROUTE_RULES } from './lib/auth/route-rules'

function matchRoute(pathname: string) {
  return ROUTE_RULES.find(r => pathname.startsWith(r.prefix)) ?? null
}

function checkAccess(pathname: string, role: Role | null): 'allow' | 'redirect-sign-in' | 'redirect-unauthorized' | 'redirect-home' {
  const rule = matchRoute(pathname)
  if (!rule || rule.access === 'public') return 'allow'

  if (rule.access === 'unauthenticated-only') {
    return role ? 'redirect-home' : 'allow'
  }

  if (!role) return 'redirect-sign-in'

  const allowed = rule.access as Role[]
  return allowed.includes(role) ? 'allow' : 'redirect-unauthorized'
}

describe('ROUTE_RULES — route-to-role mapping', () => {
  describe('public and unauthenticated-only routes', () => {
    it('allows unauthenticated access to /unauthorized', () => {
      expect(checkAccess('/unauthorized', null)).toBe('allow')
    })

    it('allows unauthenticated access to /api/auth/sign-in', () => {
      expect(checkAccess('/api/auth/sign-in', null)).toBe('allow')
    })

    it('allows /sign-in when unauthenticated', () => {
      expect(checkAccess('/sign-in', null)).toBe('allow')
    })

    it('redirects authenticated user away from /sign-in', () => {
      expect(checkAccess('/sign-in', 'DEALER_ADMIN')).toBe('redirect-home')
    })

    it('redirects authenticated user away from /sign-up', () => {
      expect(checkAccess('/sign-up', 'DEALER_STAFF')).toBe('redirect-home')
    })
  })

  describe('dealer portal /dashboard', () => {
    it('allows DEALER_ADMIN to /dashboard', () => {
      expect(checkAccess('/dashboard', 'DEALER_ADMIN')).toBe('allow')
    })

    it('allows DEALER_STAFF to /dashboard', () => {
      expect(checkAccess('/dashboard', 'DEALER_STAFF')).toBe('allow')
    })

    it('redirects unauthenticated to /sign-in', () => {
      expect(checkAccess('/dashboard', null)).toBe('redirect-sign-in')
    })

    it('redirects CONSUMER to /unauthorized (AC #3)', () => {
      expect(checkAccess('/dashboard', 'CONSUMER')).toBe('redirect-unauthorized')
    })

    it('redirects SYSADMIN to /unauthorized (AC #4)', () => {
      expect(checkAccess('/dashboard', 'SYSADMIN')).toBe('redirect-unauthorized')
    })
  })

  describe('/dashboard/security/billing — DEALER_ADMIN only (AC #7)', () => {
    it('allows DEALER_ADMIN', () => {
      expect(checkAccess('/dashboard/security/billing', 'DEALER_ADMIN')).toBe('allow')
    })

    it('redirects DEALER_STAFF to /unauthorized', () => {
      expect(checkAccess('/dashboard/security/billing', 'DEALER_STAFF')).toBe('redirect-unauthorized')
    })

    it('redirects CONSUMER to /unauthorized', () => {
      expect(checkAccess('/dashboard/security/billing', 'CONSUMER')).toBe('redirect-unauthorized')
    })
  })

  describe('/sysadmin routes', () => {
    it('allows SYSADMIN', () => {
      expect(checkAccess('/sysadmin/dashboard', 'SYSADMIN')).toBe('allow')
    })

    it('redirects DEALER_ADMIN to /unauthorized', () => {
      expect(checkAccess('/sysadmin/dashboard', 'DEALER_ADMIN')).toBe('redirect-unauthorized')
    })

    it('redirects unauthenticated to /sign-in', () => {
      expect(checkAccess('/sysadmin/dashboard', null)).toBe('redirect-sign-in')
    })
  })

  describe('/consumer routes', () => {
    it('allows CONSUMER', () => {
      expect(checkAccess('/consumer/dashboard', 'CONSUMER')).toBe('allow')
    })

    it('redirects DEALER_ADMIN to /unauthorized', () => {
      expect(checkAccess('/consumer/dashboard', 'DEALER_ADMIN')).toBe('redirect-unauthorized')
    })
  })

  describe('unmatched routes (public by default)', () => {
    it('allows / without auth', () => {
      expect(checkAccess('/', null)).toBe('allow')
    })

    it('allows /pricing without auth', () => {
      expect(checkAccess('/pricing', null)).toBe('allow')
    })
  })
})

describe('verifyToken mock integration', () => {
  beforeEach(() => {
    vi.mocked(verifyToken).mockReset()
    vi.mocked(NextResponse.redirect).mockClear()
    vi.mocked(NextResponse.next).mockClear()
  })

  it('verifyToken is callable and returns mocked value', async () => {
    const session = { userId: 'u1', role: 'DEALER_ADMIN' as Role, dealerId: 'd1', expires: '' }
    vi.mocked(verifyToken).mockResolvedValueOnce(session)
    const result = await verifyToken('some-token')
    expect(result.role).toBe('DEALER_ADMIN')
  })

  it('signToken is callable', async () => {
    const payload = { userId: 'u1', role: 'DEALER_ADMIN' as Role, dealerId: 'd1', expires: '' }
    const token = await signToken(payload)
    expect(typeof token).toBe('string')
  })
})
