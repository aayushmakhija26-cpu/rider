// Story 1.2 migration note:
// New query implementations should use the Prisma client directly:
//   import { prisma, withDealerContext } from '@/lib/db'
//
// These stubs are retained for build compatibility with template UI files.
// They will be replaced story by story as each feature is implemented.

import type { DealerUser } from '@prisma/client';
import { User, TeamDataWithMembers, ActivityLog } from './schema';
import { getSession } from '@/lib/auth/session';
import { withDealerContext, getDb } from '@/src/lib/db';

function mapDealerUserToUser(du: DealerUser): User {
  return {
    id: du.id,
    name: du.name,
    email: du.email,
    passwordHash: du.passwordHash ?? '',
    role: du.role,
    createdAt: du.createdAt,
    updatedAt: du.updatedAt,
    deletedAt: null,
  };
}

export async function getUser(userId?: string): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const id = userId ?? session.userId;
  try {
    return await withDealerContext(session.dealerId, async () => {
      const db = getDb();
      const dealerUser = await db.dealerUser.findUnique({ where: { id } });
      if (!dealerUser) return null;
      return mapDealerUserToUser(dealerUser);
    });
  } catch {
    return null;
  }
}

export async function getUserWithTeam(
  _userId: string
): Promise<{ teamId: number } | null> {
  return null;
}

export async function getTeamForUser(_userId?: string): Promise<TeamDataWithMembers | null> {
  return null;
}

export async function getTeamByStripeCustomerId(
  _customerId: string
): Promise<{ id: number } | null> {
  return null;
}

export async function updateTeamSubscription(
  _teamId: number,
  _data: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
): Promise<void> {
  return;
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  return [];
}
