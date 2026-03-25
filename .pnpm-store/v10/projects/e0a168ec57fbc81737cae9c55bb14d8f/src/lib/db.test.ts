import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist the mock tx so it's accessible in assertions (vi.hoisted runs before vi.mock).
const mockExecuteRaw = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@prisma/client', () => {
  class PrismaClient {
    $transaction = vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({ $executeRaw: mockExecuteRaw })
    )
  }
  return { PrismaClient }
})

import { dealerContext, withDealerContext } from './db'

beforeEach(() => {
  mockExecuteRaw.mockClear()
})

describe('withDealerContext', () => {
  it('sets dealerId in AsyncLocalStorage during execution', async () => {
    await withDealerContext('dealer-123', async () => {
      expect(dealerContext.getStore()?.dealerId).toBe('dealer-123')
    })
  })

  it('calls set_config with the correct dealerId', async () => {
    await withDealerContext('dealer-123', async () => {})
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1)
    // Prisma tagged-template $executeRaw passes the SQL parts and then interpolated values.
    // The first argument is the TemplateStringsArray; subsequent args are the bound values.
    expect(mockExecuteRaw).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('set_config')]),
      'dealer-123'
    )
  })

  it('restores undefined context after execution completes', async () => {
    await withDealerContext('dealer-123', async () => {})
    expect(dealerContext.getStore()).toBeUndefined()
  })

  it('handles null dealerId without throwing', async () => {
    await expect(withDealerContext(null, async () => 'ok')).resolves.toBe('ok')
  })

  it('sets null dealerId in context when null is passed', async () => {
    await withDealerContext(null, async () => {
      expect(dealerContext.getStore()?.dealerId).toBeNull()
    })
  })

  it('does not call set_config when dealerId is null', async () => {
    await withDealerContext(null, async () => {})
    expect(mockExecuteRaw).not.toHaveBeenCalled()
  })

  it('rejects empty-string dealerId', async () => {
    await expect(withDealerContext('', async () => {})).rejects.toThrow(
      'dealerId cannot be an empty string'
    )
  })

  it('correctly isolates context between concurrent executions', async () => {
    const pairs: Array<{ expected: string; actual: string | null | undefined }> = []

    await Promise.all([
      withDealerContext('dealer-aaa', async () => {
        await new Promise((r) => setTimeout(r, 10))
        pairs.push({ expected: 'dealer-aaa', actual: dealerContext.getStore()?.dealerId })
      }),
      withDealerContext('dealer-bbb', async () => {
        await new Promise((r) => setTimeout(r, 5))
        pairs.push({ expected: 'dealer-bbb', actual: dealerContext.getStore()?.dealerId })
      }),
    ])

    expect(pairs).toHaveLength(2)
    for (const { expected, actual } of pairs) {
      expect(actual).toBe(expected)
    }
  })
})
