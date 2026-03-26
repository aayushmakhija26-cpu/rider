import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DealerUser } from '@prisma/client'

// Mock prisma before importing the helper
vi.mock('@/src/lib/db', () => ({
  prisma: {
    oAuthAccount: {
      findFirst: vi.fn(),
      createMany: vi.fn(),
      create: vi.fn(),
    },
    dealerUser: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    dealer: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { findOrCreateOAuthUser } from './_oauth-helpers'
import { prisma } from '@/src/lib/db'

const mockPrisma = prisma as unknown as {
  oAuthAccount: {
    findFirst: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  dealerUser: {
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  dealer: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

const baseDealerUser = {
  id: 'user-1',
  dealerId: 'dealer-1',
  email: 'test@example.com',
  passwordHash: null,
  name: 'Test User',
  role: 'DEALER_ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
} as DealerUser

beforeEach(() => {
  vi.clearAllMocks()
})

describe('findOrCreateOAuthUser', () => {
  it('returns existing user when found by OAuthAccount provider+providerId', async () => {
    mockPrisma.oAuthAccount.findFirst.mockResolvedValueOnce({
      id: 'account-1',
      dealerUserId: 'user-1',
      provider: 'google',
      providerId: 'google-sub-123',
      dealerUser: baseDealerUser,
    })

    const result = await findOrCreateOAuthUser({
      email: 'test@example.com',
      provider: 'google',
      providerId: 'google-sub-123',
    })

    expect(result).toBe(baseDealerUser)
    expect(mockPrisma.oAuthAccount.findFirst).toHaveBeenCalledTimes(1)
    expect(mockPrisma.oAuthAccount.findFirst).toHaveBeenCalledWith({
      where: { provider: 'google', providerId: 'google-sub-123' },
      include: { dealerUser: true },
    })
    expect(mockPrisma.dealerUser.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('links OAuth account to all existing DealerUsers with matching email across tenants', async () => {
    const user1 = { ...baseDealerUser, id: 'user-1', dealerId: 'dealer-1' }
    const user2 = { ...baseDealerUser, id: 'user-2', dealerId: 'dealer-2' }

    mockPrisma.oAuthAccount.findFirst.mockResolvedValueOnce(null)
    mockPrisma.dealerUser.findMany.mockResolvedValueOnce([user1, user2])
    mockPrisma.oAuthAccount.createMany.mockResolvedValueOnce({ count: 2 })

    const result = await findOrCreateOAuthUser({
      email: 'test@example.com',
      provider: 'google',
      providerId: 'google-sub-new',
    })

    expect(result).toBe(user1)
    expect(mockPrisma.oAuthAccount.createMany).toHaveBeenCalledWith({
      data: [
        { dealerUserId: 'user-1', provider: 'google', providerId: 'google-sub-new' },
        { dealerUserId: 'user-2', provider: 'google', providerId: 'google-sub-new' },
      ],
      skipDuplicates: true,
    })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates new Dealer, DealerUser, and OAuthAccount atomically for brand-new user', async () => {
    mockPrisma.oAuthAccount.findFirst.mockResolvedValueOnce(null)
    mockPrisma.dealerUser.findMany.mockResolvedValueOnce([])

    const newDealer = { id: 'dealer-new', name: 'Example Auto', email: 'new@example.com' }
    const newDealerUser: DealerUser = {
      ...baseDealerUser,
      id: 'user-new',
      dealerId: 'dealer-new',
      email: 'new@example.com',
    }

    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mockPrisma) => Promise<DealerUser>) => {
        const tx = {
          dealer: {
            findFirst: vi.fn().mockResolvedValueOnce(null),
            create: vi.fn().mockResolvedValueOnce(newDealer),
          },
          dealerUser: { create: vi.fn().mockResolvedValueOnce(newDealerUser) },
          oAuthAccount: { create: vi.fn().mockResolvedValueOnce({}) },
          onboardingStep: { createMany: vi.fn().mockResolvedValueOnce({ count: 4 }) },
        }
        return fn(tx as unknown as typeof mockPrisma)
      }
    )

    const result = await findOrCreateOAuthUser({
      email: 'new@example.com',
      name: 'New User',
      provider: 'apple',
      providerId: 'apple-sub-456',
    })

    expect(result).toBe(newDealerUser)
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    expect(mockPrisma.oAuthAccount.createMany).not.toHaveBeenCalled()
  })

  it('new DealerUser is created with passwordHash null and role DEALER_ADMIN', async () => {
    mockPrisma.oAuthAccount.findFirst.mockResolvedValueOnce(null)
    mockPrisma.dealerUser.findMany.mockResolvedValueOnce([])

    let capturedData: Record<string, unknown> | null = null
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mockPrisma) => Promise<DealerUser>) => {
        const newDealer = { id: 'dealer-x', name: 'Honda Auto', email: 'admin@honda.com' }
        const tx = {
          dealer: {
            findFirst: vi.fn().mockResolvedValueOnce(null),
            create: vi.fn().mockResolvedValueOnce(newDealer),
          },
          dealerUser: {
            create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
              capturedData = args.data
              return Promise.resolve({ ...baseDealerUser, ...args.data })
            }),
          },
          oAuthAccount: { create: vi.fn().mockResolvedValueOnce({}) },
          onboardingStep: { createMany: vi.fn().mockResolvedValueOnce({ count: 4 }) },
        }
        return fn(tx as unknown as typeof mockPrisma)
      }
    )

    await findOrCreateOAuthUser({
      email: 'admin@honda.com',
      provider: 'google',
      providerId: 'google-sub-789',
    })

    expect(capturedData).not.toBeNull()
    expect(capturedData!.passwordHash).toBeNull()
    expect(capturedData!.role).toBe('DEALER_ADMIN')
  })

  it('reuses existing Dealer when one already exists with the same email', async () => {
    mockPrisma.oAuthAccount.findFirst.mockResolvedValueOnce(null)
    mockPrisma.dealerUser.findMany.mockResolvedValueOnce([])

    const existingDealer = { id: 'dealer-existing', name: 'Existing Auto', email: 'user@corp.com' }
    const newUser: DealerUser = { ...baseDealerUser, dealerId: 'dealer-existing', email: 'user@corp.com' }

    let dealerCreateCalled = false
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mockPrisma) => Promise<DealerUser>) => {
        const tx = {
          dealer: {
            findFirst: vi.fn().mockResolvedValueOnce(existingDealer),
            create: vi.fn().mockImplementation(() => {
              dealerCreateCalled = true
              return Promise.resolve({})
            }),
          },
          dealerUser: { create: vi.fn().mockResolvedValueOnce(newUser) },
          oAuthAccount: { create: vi.fn().mockResolvedValueOnce({}) },
          onboardingStep: { createMany: vi.fn().mockResolvedValueOnce({ count: 4 }) },
        }
        return fn(tx as unknown as typeof mockPrisma)
      }
    )

    await findOrCreateOAuthUser({ email: 'user@corp.com', provider: 'apple', providerId: 'sub-x' })

    expect(dealerCreateCalled).toBe(false)
  })
})
