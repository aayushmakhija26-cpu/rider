import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { AsyncLocalStorage } from 'async_hooks'

// Prisma 7 uses the client engine (WASM-based) which requires a driver adapter.
// PrismaNeon with Pool supports interactive transactions, which withDealerContext
// uses to SET app.current_dealer_id on the same connection as the query.
//
// Services should call getDb() rather than importing prisma directly so that
// queries automatically pick up the transaction-scoped client (with RLS set)
// when called inside withDealerContext.

// AsyncLocalStorage holds the per-request dealer context (for read-only inspection
// by middleware, logging, etc.) and the active transaction client (for RLS queries).
type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>

export const dealerContext = new AsyncLocalStorage<{ dealerId: string | null }>()
const txContext = new AsyncLocalStorage<TxClient>()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  // PrismaNeon takes a PoolConfig (not a Pool instance).
  // DATABASE_URL validation is deferred to connection time so tests can mock PrismaClient.
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL ?? '' })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Get the active database client for the current execution context.
 * - Inside withDealerContext: returns the transaction-scoped client (RLS enforced).
 * - Outside: returns the base prisma client (no RLS, use for SysAdmin operations).
 *
 * Usage in service files:
 *   const db = getDb()
 *   return db.consumer.findMany(...)
 */
export function getDb(): TxClient {
  return txContext.getStore() ?? (prisma as unknown as TxClient)
}

/**
 * Run a function within a dealer's RLS context.
 *
 * Starts an interactive transaction, sets app.current_dealer_id on that
 * connection, stores the transaction handle in AsyncLocalStorage, then
 * calls fn(). Services that call getDb() will automatically use the
 * transaction-scoped client with RLS enforced.
 *
 * SysAdmin bypass: pass null to skip RLS setup. SysAdmin code should use
 * getDb() or prisma directly and never go through tenant-scoped services.
 *
 * @example
 * // In a Route Handler:
 * export async function GET(req: Request) {
 *   const session = await getServerSession()
 *   return withDealerContext(session?.dealerId ?? null, async () => {
 *     const consumers = await consumerService.findAll()  // uses getDb() internally
 *     return Response.json(consumers)
 *   })
 * }
 */
export async function withDealerContext<T>(
  dealerId: string | null,
  fn: () => Promise<T>
): Promise<T> {
  if (dealerId === undefined) {
    throw new Error('withDealerContext: dealerId must not be undefined. Pass null for SysAdmin bypass.')
  }
  if (dealerId === '') {
    throw new Error('withDealerContext: dealerId cannot be an empty string. Pass null for SysAdmin bypass.')
  }

  if (dealerId === null) {
    // SysAdmin bypass: no RLS context set. Queries on tenant-scoped tables will
    // return zero rows unless the DB role has BYPASSRLS or is the table owner.
    // SysAdmin operations should use a dedicated BYPASSRLS Postgres role in production.
    return dealerContext.run({ dealerId: null }, fn)
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_dealer_id', ${dealerId}, true)`
    return txContext.run(
      tx as unknown as TxClient,
      () => dealerContext.run({ dealerId }, fn)
    )
  })
}
