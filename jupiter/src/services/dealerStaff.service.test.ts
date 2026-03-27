import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createStaffInviteToken,
  hashInviteToken,
  createPendingStaffInvite,
  getStaffInviteState,
  acceptStaffInvite,
  deactivateStaffAccount,
  getActiveUserForPasswordSignIn,
  DealerStaffError,
} from './dealerStaff.service';
import { prisma } from '@/src/lib/db';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/src/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    dealerUser: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    dealer: {
      findUnique: vi.fn(),
    },
  },
  getDb: vi.fn(() => ({
    dealerUser: {
      findMany: vi.fn(),
    },
  })),
}));

vi.mock('./invitationEmail.service', () => ({
  sendStaffInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStaffUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'staff-1',
    dealerId: 'dealer-1',
    email: 'staff@dealership.com',
    name: null,
    passwordHash: null,
    role: 'DEALER_STAFF' as const,
    inviteTokenHash: 'hash-abc',
    inviteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    invitedAt: new Date(),
    acceptedAt: null,
    deactivatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeAdmin(overrides: Record<string, unknown> = {}) {
  return {
    id: 'admin-1',
    dealerId: 'dealer-1',
    email: 'admin@dealership.com',
    name: 'Admin User',
    passwordHash: 'hash',
    role: 'DEALER_ADMIN' as const,
    inviteTokenHash: null,
    inviteExpiresAt: null,
    invitedAt: null,
    acceptedAt: null,
    deactivatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDealer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dealer-1',
    name: 'Test Dealer',
    email: 'dealer@test.com',
    logoUrl: null,
    primaryColour: null,
    secondaryColour: null,
    contactPhone: null,
    contactEmail: null,
    websiteUrl: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeProductId: null,
    planName: null,
    subscriptionStatus: null,
    simulationMode: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Token utilities
// ---------------------------------------------------------------------------

describe('createStaffInviteToken', () => {
  it('returns a raw token, a SHA-256 hash, and an expiry', () => {
    const now = new Date();
    const { rawToken, tokenHash, expiresAt } = createStaffInviteToken(now);

    expect(rawToken).toBeTypeOf('string');
    expect(rawToken.length).toBeGreaterThan(32);
    expect(tokenHash).toBeTypeOf('string');
    expect(tokenHash).toHaveLength(64); // sha256 hex = 32 bytes = 64 hex chars
    expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it('stores only the hash — raw token and hash differ', () => {
    const { rawToken, tokenHash } = createStaffInviteToken();
    expect(rawToken).not.toBe(tokenHash);
  });

  it('hashing the raw token produces the stored hash', () => {
    const { rawToken, tokenHash } = createStaffInviteToken();
    expect(hashInviteToken(rawToken)).toBe(tokenHash);
  });

  it('expiry is ~72 hours from now', () => {
    const now = new Date();
    const { expiresAt } = createStaffInviteToken(now);
    const diffHours = (expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000);
    expect(diffHours).toBeCloseTo(72, 0);
  });
});

// ---------------------------------------------------------------------------
// createPendingStaffInvite
// ---------------------------------------------------------------------------

describe('createPendingStaffInvite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates a pending staff record and sends an invite email', async () => {
    const created = makeStaffUser();
    const admin = makeAdmin();
    const dealer = makeDealer();
    const mockEmail = vi.fn().mockResolvedValue(undefined);

    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(admin as never);
    vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(dealer as never);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(created),
          update: vi.fn(),
        },
      })
    );

    const result = await createPendingStaffInvite(
      'dealer-1',
      'staff@dealership.com',
      'admin-1',
      mockEmail
    );

    expect(result.email).toBe(created.email);
    expect(result.role).toBe('DEALER_STAFF');
    expect(result.status).toBe('pending');
    expect(result.inviteMode).toBe('created');
    expect(mockEmail).toHaveBeenCalledOnce();
  });

  it('throws CONFLICT if email belongs to a DEALER_ADMIN', async () => {
    const admin = makeAdmin();
    const existingAdmin = makeAdmin({ email: 'staff@dealership.com', role: 'DEALER_ADMIN' as const });
    const dealer = makeDealer();
    const mockEmail = vi.fn();

    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(admin as never);
    vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(dealer as never);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findFirst: vi.fn().mockResolvedValue(existingAdmin),
          create: vi.fn(),
          update: vi.fn(),
        },
      })
    );

    await expect(
      createPendingStaffInvite('dealer-1', 'staff@dealership.com', 'admin-1', mockEmail)
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(mockEmail).not.toHaveBeenCalled();
  });

  it('throws CONFLICT if email is an active staff at another dealer', async () => {
    const admin = makeAdmin();
    const foreignStaff = makeStaffUser({ dealerId: 'other-dealer', acceptedAt: new Date() });
    const dealer = makeDealer();
    const mockEmail = vi.fn();

    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(admin as never);
    vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(dealer as never);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findFirst: vi.fn().mockResolvedValue(foreignStaff),
          create: vi.fn(),
          update: vi.fn(),
        },
      })
    );

    await expect(
      createPendingStaffInvite('dealer-1', 'staff@dealership.com', 'admin-1', mockEmail)
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('throws FORBIDDEN if inviter is not DEALER_ADMIN for the dealer', async () => {
    const nonAdmin = makeStaffUser({ id: 'staff-2', role: 'DEALER_STAFF' as const });
    const dealer = makeDealer();
    const mockEmail = vi.fn();

    // assertInviterCanManageStaff checks actor role
    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(nonAdmin as never);
    // getDealerForInvite runs concurrently — ensure it resolves so FORBIDDEN wins
    vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(dealer as never);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn(),
          update: vi.fn(),
        },
      })
    );

    await expect(
      createPendingStaffInvite('dealer-1', 'new@dealership.com', 'staff-2', mockEmail)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('resends invite to existing pending staff (same dealer)', async () => {
    const admin = makeAdmin();
    const existing = makeStaffUser({ acceptedAt: null, deactivatedAt: null });
    const dealer = makeDealer();
    const updated = { ...existing, inviteTokenHash: 'new-hash', invitedAt: new Date() };
    const mockEmail = vi.fn().mockResolvedValue(undefined);

    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(admin as never);
    vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(dealer as never);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findFirst: vi.fn().mockResolvedValue(existing),
          create: vi.fn(),
          update: vi.fn().mockResolvedValue(updated),
        },
      })
    );

    const result = await createPendingStaffInvite(
      'dealer-1',
      'staff@dealership.com',
      'admin-1',
      mockEmail
    );

    expect(result.inviteMode).toBe('resent');
    expect(mockEmail).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// acceptStaffInvite
// ---------------------------------------------------------------------------

describe('acceptStaffInvite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('activates the account: sets name, passwordHash, acceptedAt, clears token fields', async () => {
    const pending = makeStaffUser();
    const accepted = {
      ...pending,
      name: 'Jane Smith',
      passwordHash: 'hashed',
      acceptedAt: new Date(),
      inviteTokenHash: null,
      inviteExpiresAt: null,
    };

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findUnique: vi.fn().mockResolvedValue(pending),
          update: vi.fn().mockResolvedValue(accepted),
        },
      })
    );

    const result = await acceptStaffInvite('raw-token', 'Jane Smith', 'hashed');

    expect(result.acceptedAt).not.toBeNull();
    expect(result.inviteTokenHash).toBeNull();
    expect(result.inviteExpiresAt).toBeNull();
    expect(result.name).toBe('Jane Smith');
    expect(result.passwordHash).toBe('hashed');
  });

  it('throws INVALID_INVITE for an unknown token', async () => {
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({ dealerUser: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() } })
    );

    await expect(acceptStaffInvite('bad-token', 'name', 'hash')).rejects.toMatchObject({
      code: 'INVALID_INVITE',
    });
  });

  it('throws INVITE_DEACTIVATED for a deactivated invite', async () => {
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findUnique: vi.fn().mockResolvedValue(makeStaffUser({ deactivatedAt: new Date() })),
          update: vi.fn(),
        },
      })
    );

    await expect(acceptStaffInvite('token', 'name', 'hash')).rejects.toMatchObject({
      code: 'INVITE_DEACTIVATED',
    });
  });

  it('throws INVITE_ALREADY_ACCEPTED for an already-accepted invite', async () => {
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findUnique: vi.fn().mockResolvedValue(makeStaffUser({ acceptedAt: new Date() })),
          update: vi.fn(),
        },
      })
    );

    await expect(acceptStaffInvite('token', 'name', 'hash')).rejects.toMatchObject({
      code: 'INVITE_ALREADY_ACCEPTED',
    });
  });

  it('throws INVITE_EXPIRED for an expired invite', async () => {
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findUnique: vi.fn().mockResolvedValue(
            makeStaffUser({ inviteExpiresAt: new Date(Date.now() - 1000) })
          ),
          update: vi.fn(),
        },
      })
    );

    await expect(acceptStaffInvite('token', 'name', 'hash')).rejects.toMatchObject({
      code: 'INVITE_EXPIRED',
    });
  });

  it('preserves DEALER_STAFF role after acceptance', async () => {
    const pending = makeStaffUser();
    const accepted = { ...pending, acceptedAt: new Date(), passwordHash: 'h', name: 'N' };

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        dealerUser: {
          findUnique: vi.fn().mockResolvedValue(pending),
          update: vi.fn().mockResolvedValue(accepted),
        },
      })
    );

    const result = await acceptStaffInvite('t', 'N', 'h');
    expect(result.role).toBe('DEALER_STAFF');
  });
});

// ---------------------------------------------------------------------------
// deactivateStaffAccount
// ---------------------------------------------------------------------------

describe('deactivateStaffAccount', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deactivates an active staff account', async () => {
    const admin = makeAdmin();
    const staff = makeStaffUser({ acceptedAt: new Date() });
    const deactivated = {
      ...staff,
      deactivatedAt: new Date(),
      inviteTokenHash: null,
      inviteExpiresAt: null,
    };

    vi.mocked(prisma.dealerUser.findUnique)
      .mockResolvedValueOnce(admin as never)  // assertInviterCanManageStaff
      .mockResolvedValueOnce(staff as never); // fetch staffUser
    vi.mocked(prisma.dealerUser.update).mockResolvedValueOnce(deactivated as never);

    const result = await deactivateStaffAccount('dealer-1', 'staff-1', 'admin-1');

    expect(result.deactivatedAt).not.toBeNull();
    expect(result.inviteTokenHash).toBeNull();
    expect(prisma.dealerUser.update).toHaveBeenCalledOnce();
  });

  it('throws FORBIDDEN if actor is not DEALER_ADMIN', async () => {
    const nonAdmin = makeStaffUser({ id: 'actor-2', role: 'DEALER_STAFF' as const });
    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(nonAdmin as never);

    await expect(
      deactivateStaffAccount('dealer-1', 'staff-1', 'actor-2')
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('throws FORBIDDEN if actor tries to deactivate themselves', async () => {
    await expect(
      deactivateStaffAccount('dealer-1', 'admin-1', 'admin-1')
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('throws FORBIDDEN if staff belongs to a different dealer', async () => {
    const admin = makeAdmin();
    const foreignStaff = makeStaffUser({ dealerId: 'other-dealer' });

    vi.mocked(prisma.dealerUser.findUnique)
      .mockResolvedValueOnce(admin as never)
      .mockResolvedValueOnce(foreignStaff as never);

    await expect(
      deactivateStaffAccount('dealer-1', 'staff-1', 'admin-1')
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('throws CONFLICT if target is not DEALER_STAFF', async () => {
    const admin = makeAdmin();
    const anotherAdmin = makeAdmin({ id: 'admin-2' });

    vi.mocked(prisma.dealerUser.findUnique)
      .mockResolvedValueOnce(admin as never)
      .mockResolvedValueOnce(anotherAdmin as never);

    await expect(
      deactivateStaffAccount('dealer-1', 'admin-2', 'admin-1')
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('returns the record as-is if already deactivated (idempotent)', async () => {
    const admin = makeAdmin();
    const alreadyDeactivated = makeStaffUser({ deactivatedAt: new Date() });

    vi.mocked(prisma.dealerUser.findUnique)
      .mockResolvedValueOnce(admin as never)
      .mockResolvedValueOnce(alreadyDeactivated as never);

    const result = await deactivateStaffAccount('dealer-1', 'staff-1', 'admin-1');

    expect(result.deactivatedAt).not.toBeNull();
    expect(prisma.dealerUser.update).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getActiveUserForPasswordSignIn — deactivated user guard
// ---------------------------------------------------------------------------

describe('getActiveUserForPasswordSignIn', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns user for an active accepted DEALER_ADMIN', async () => {
    const admin = makeAdmin({ acceptedAt: new Date() });
    vi.mocked(prisma.dealerUser.findFirst).mockResolvedValueOnce(admin as never);

    const result = await getActiveUserForPasswordSignIn('admin@dealership.com');
    expect(result).not.toBeNull();
    expect(result?.id).toBe(admin.id);
  });

  it('returns null for a deactivated user (session revocation guard)', async () => {
    // deactivatedAt != null means findFirst returns null (filtered by where clause)
    vi.mocked(prisma.dealerUser.findFirst).mockResolvedValueOnce(null);

    const result = await getActiveUserForPasswordSignIn('staff@dealership.com');
    expect(result).toBeNull();
  });

  it('returns null for a pending (not yet accepted) DEALER_STAFF user', async () => {
    const pending = makeStaffUser({ acceptedAt: null });
    vi.mocked(prisma.dealerUser.findFirst).mockResolvedValueOnce(pending as never);

    const result = await getActiveUserForPasswordSignIn('staff@dealership.com');
    expect(result).toBeNull();
  });

  it('returns null when email is not found', async () => {
    vi.mocked(prisma.dealerUser.findFirst).mockResolvedValueOnce(null);

    const result = await getActiveUserForPasswordSignIn('unknown@example.com');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getStaffInviteState
// ---------------------------------------------------------------------------

describe('getStaffInviteState', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns "invalid" for an unknown token', async () => {
    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(null);

    const state = await getStaffInviteState('bad-token');
    expect(state.status).toBe('invalid');
  });

  it('returns "expired" for a past expiry', async () => {
    const invite = {
      dealerId: 'dealer-1',
      email: 'staff@test.com',
      role: 'DEALER_STAFF' as const,
      inviteExpiresAt: new Date(Date.now() - 1000),
      acceptedAt: null,
      deactivatedAt: null,
      dealer: { name: 'Test Dealer' },
    };
    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(invite as never);

    const state = await getStaffInviteState('expired-token');
    expect(state.status).toBe('expired');
  });

  it('returns "accepted" for an already-accepted invite', async () => {
    const invite = {
      dealerId: 'dealer-1',
      email: 'staff@test.com',
      role: 'DEALER_STAFF' as const,
      inviteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      acceptedAt: new Date(),
      deactivatedAt: null,
      dealer: { name: 'Test Dealer' },
    };
    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(invite as never);

    const state = await getStaffInviteState('token');
    expect(state.status).toBe('accepted');
  });

  it('returns "deactivated" for a deactivated invite', async () => {
    const invite = {
      dealerId: 'dealer-1',
      email: 'staff@test.com',
      role: 'DEALER_STAFF' as const,
      inviteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      acceptedAt: null,
      deactivatedAt: new Date(),
      dealer: { name: 'Test Dealer' },
    };
    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(invite as never);

    const state = await getStaffInviteState('token');
    expect(state.status).toBe('deactivated');
  });

  it('returns "valid" with email and dealerName for a valid invite', async () => {
    const invite = {
      dealerId: 'dealer-1',
      email: 'staff@test.com',
      role: 'DEALER_STAFF' as const,
      inviteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      acceptedAt: null,
      deactivatedAt: null,
      dealer: { name: 'Test Dealer' },
    };
    vi.mocked(prisma.dealerUser.findUnique).mockResolvedValueOnce(invite as never);

    const state = await getStaffInviteState('valid-token');
    expect(state.status).toBe('valid');
    if (state.status === 'valid') {
      expect(state.email).toBe('staff@test.com');
      expect(state.dealerName).toBe('Test Dealer');
    }
  });
});
