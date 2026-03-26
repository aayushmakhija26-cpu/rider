import { randomBytes, randomUUID, createHash } from 'crypto';
import type { DealerUser, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { getDb, prisma } from '@/src/lib/db';
import {
  sendStaffInvitationEmail,
  type StaffInvitationEmailInput,
} from './invitationEmail.service';

const STAFF_INVITE_EXPIRY_HOURS = 72;

export type DealerStaffStatus = 'pending' | 'active' | 'deactivated';

export type DealerStaffSummary = Pick<
  DealerUser,
  | 'id'
  | 'dealerId'
  | 'email'
  | 'name'
  | 'role'
  | 'invitedAt'
  | 'acceptedAt'
  | 'deactivatedAt'
  | 'createdAt'
  | 'updatedAt'
> & {
  status: DealerStaffStatus;
};

export type StaffInviteState =
  | {
      status: 'valid';
      dealerId: string;
      dealerName: string;
      email: string;
      expiresAt: Date;
      role: Role;
    }
  | {
      status: 'invalid' | 'expired' | 'accepted' | 'deactivated';
      dealerId?: string;
      dealerName?: string;
      email?: string;
      expiresAt?: Date | null;
      role?: Role;
    };

export class DealerStaffError extends Error {
  code:
    | 'CONFLICT'
    | 'FORBIDDEN'
    | 'INVALID_INVITE'
    | 'INVITE_ALREADY_ACCEPTED'
    | 'INVITE_DEACTIVATED'
    | 'INVITE_EXPIRED'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR';

  constructor(
    code:
      | 'CONFLICT'
      | 'FORBIDDEN'
      | 'INVALID_INVITE'
      | 'INVITE_ALREADY_ACCEPTED'
      | 'INVITE_DEACTIVATED'
      | 'INVITE_EXPIRED'
      | 'NOT_FOUND'
      | 'VALIDATION_ERROR',
    message?: string
  ) {
    super(message ?? code);
    this.code = code;
  }
}

type InvitationEmailSender = (
  input: StaffInvitationEmailInput
) => Promise<void>;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashInviteToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function createStaffInviteToken(now = new Date()) {
  const rawToken = `${randomUUID()}-${randomBytes(16).toString('hex')}`;
  const expiresAt = new Date(now.getTime() + STAFF_INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

  return {
    rawToken,
    tokenHash: hashInviteToken(rawToken),
    expiresAt,
  };
}

function getInviteUrl(rawToken: string): string {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  return `${baseUrl.replace(/\/$/, '')}/accept-invite/${rawToken}`;
}

function deriveStaffStatus(
  dealerUser: Pick<DealerUser, 'acceptedAt' | 'deactivatedAt'>
): DealerStaffStatus {
  if (dealerUser.deactivatedAt) {
    return 'deactivated';
  }

  if (dealerUser.acceptedAt) {
    return 'active';
  }

  return 'pending';
}

function isAcceptedStaffUser(
  dealerUser: Pick<DealerUser, 'role' | 'acceptedAt'>
): boolean {
  return dealerUser.role !== 'DEALER_STAFF' || dealerUser.acceptedAt !== null;
}

async function assertInviterCanManageStaff(
  dealerId: string,
  invitedByUserId: string
) {
  const inviter = await prisma.dealerUser.findUnique({
    where: { id: invitedByUserId },
    select: {
      id: true,
      dealerId: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!inviter || inviter.dealerId !== dealerId || inviter.role !== 'DEALER_ADMIN') {
    throw new DealerStaffError(
      'FORBIDDEN',
      'Only a dealer admin for this dealership can manage staff'
    );
  }

  return inviter;
}

async function getDealerForInvite(dealerId: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!dealer) {
    throw new DealerStaffError('NOT_FOUND', 'Dealer not found');
  }

  return dealer;
}

export async function createPendingStaffInvite(
  dealerId: string,
  email: string,
  invitedByUserId: string,
  sendInvitationEmail: InvitationEmailSender = sendStaffInvitationEmail
): Promise<
  DealerStaffSummary & {
    inviteExpiresAt: Date;
    inviteMode: 'created' | 'resent';
  }
> {
  const normalisedEmail = normaliseEmail(email);

  if (!normalisedEmail) {
    throw new DealerStaffError('VALIDATION_ERROR', 'Email is required');
  }

  try {
    const now = new Date();
    const { rawToken, tokenHash, expiresAt } = createStaffInviteToken(now);

    const inviteResult = await prisma.$transaction(async (tx) => {
      const [inviter, dealer, existingUser] = await Promise.all([
        assertInviterCanManageStaff(dealerId, invitedByUserId),
        getDealerForInvite(dealerId),
        tx.dealerUser.findFirst({
          where: { email: normalisedEmail },
          select: {
            id: true,
            dealerId: true,
            email: true,
            name: true,
            role: true,
            invitedAt: true,
            acceptedAt: true,
            deactivatedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      if (existingUser) {
        const isSamePendingStaffInvite =
          existingUser.dealerId === dealerId &&
          existingUser.role === 'DEALER_STAFF' &&
          existingUser.acceptedAt === null &&
          existingUser.deactivatedAt === null;

        if (!isSamePendingStaffInvite) {
          if (existingUser.role === 'DEALER_ADMIN') {
            throw new DealerStaffError(
              'CONFLICT',
              'A dealer admin already exists with that email address'
            );
          }

          throw new DealerStaffError(
            'CONFLICT',
            'A staff account already exists with that email address'
          );
        }

        const updated = await tx.dealerUser.update({
          where: { id: existingUser.id },
          data: {
            inviteTokenHash: tokenHash,
            inviteExpiresAt: expiresAt,
            invitedAt: now,
          },
          select: {
            id: true,
            dealerId: true,
            email: true,
            name: true,
            role: true,
            invitedAt: true,
            acceptedAt: true,
            deactivatedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return {
          dealer,
          inviter,
          staffUser: updated,
          inviteMode: 'resent' as const,
        };
      }

      const created = await tx.dealerUser.create({
        data: {
          dealerId,
          email: normalisedEmail,
          role: 'DEALER_STAFF',
          inviteTokenHash: tokenHash,
          inviteExpiresAt: expiresAt,
          invitedAt: now,
        },
        select: {
          id: true,
          dealerId: true,
          email: true,
          name: true,
          role: true,
          invitedAt: true,
          acceptedAt: true,
          deactivatedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        dealer,
        inviter,
        staffUser: created,
        inviteMode: 'created' as const,
      };
    });

    await sendInvitationEmail({
      dealerName: inviteResult.dealer.name,
      expiresAt,
      idempotencyKey: `dealer-staff-invite:${inviteResult.staffUser.id}:${expiresAt.toISOString()}`,
      inviteUrl: getInviteUrl(rawToken),
      invitedByName: inviteResult.inviter.name ?? inviteResult.inviter.email,
      toEmail: inviteResult.staffUser.email,
    });

    return {
      ...inviteResult.staffUser,
      inviteExpiresAt: expiresAt,
      inviteMode: inviteResult.inviteMode,
      status: deriveStaffStatus(inviteResult.staffUser),
    };
  } catch (error) {
    if (error instanceof DealerStaffError) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new DealerStaffError(
        'CONFLICT',
        'A staff account already exists with that email address'
      );
    }

    throw error;
  }
}

export async function listDealerStaff(dealerId: string): Promise<DealerStaffSummary[]> {
  const db = getDb();
  const staffUsers = await db.dealerUser.findMany({
    where: {
      dealerId,
      role: 'DEALER_STAFF',
    },
    orderBy: [{ invitedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      dealerId: true,
      email: true,
      name: true,
      role: true,
      invitedAt: true,
      acceptedAt: true,
      deactivatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return staffUsers.map((staffUser) => ({
    ...staffUser,
    status: deriveStaffStatus(staffUser),
  }));
}

export async function getStaffInviteState(rawToken: string): Promise<StaffInviteState> {
  const invite = await prisma.dealerUser.findUnique({
    where: {
      inviteTokenHash: hashInviteToken(rawToken),
    },
    select: {
      dealerId: true,
      email: true,
      role: true,
      inviteExpiresAt: true,
      acceptedAt: true,
      deactivatedAt: true,
      dealer: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invite) {
    return { status: 'invalid' };
  }

  if (invite.deactivatedAt) {
    return {
      status: 'deactivated',
      dealerId: invite.dealerId,
      dealerName: invite.dealer.name,
      email: invite.email,
      expiresAt: invite.inviteExpiresAt,
      role: invite.role,
    };
  }

  if (invite.acceptedAt) {
    return {
      status: 'accepted',
      dealerId: invite.dealerId,
      dealerName: invite.dealer.name,
      email: invite.email,
      expiresAt: invite.inviteExpiresAt,
      role: invite.role,
    };
  }

  if (!invite.inviteExpiresAt || invite.inviteExpiresAt.getTime() < Date.now()) {
    return {
      status: 'expired',
      dealerId: invite.dealerId,
      dealerName: invite.dealer.name,
      email: invite.email,
      expiresAt: invite.inviteExpiresAt,
      role: invite.role,
    };
  }

  return {
    status: 'valid',
    dealerId: invite.dealerId,
    dealerName: invite.dealer.name,
    email: invite.email,
    expiresAt: invite.inviteExpiresAt,
    role: invite.role,
  };
}

export async function acceptStaffInvite(
  rawToken: string,
  name: string,
  passwordHash: string
): Promise<DealerUser> {
  const tokenHash = hashInviteToken(rawToken);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const invite = await tx.dealerUser.findUnique({
      where: { inviteTokenHash: tokenHash },
    });

    if (!invite) {
      throw new DealerStaffError('INVALID_INVITE', 'Invite token is invalid');
    }

    if (invite.deactivatedAt) {
      throw new DealerStaffError(
        'INVITE_DEACTIVATED',
        'This invite has been deactivated'
      );
    }

    if (invite.acceptedAt) {
      throw new DealerStaffError(
        'INVITE_ALREADY_ACCEPTED',
        'This invite has already been accepted'
      );
    }

    if (!invite.inviteExpiresAt || invite.inviteExpiresAt.getTime() < now.getTime()) {
      throw new DealerStaffError('INVITE_EXPIRED', 'This invite has expired');
    }

    return tx.dealerUser.update({
      where: { id: invite.id },
      data: {
        name: name.trim(),
        passwordHash,
        acceptedAt: now,
        inviteTokenHash: null,
        inviteExpiresAt: null,
      },
    });
  });
}

export async function deactivateStaffAccount(
  dealerId: string,
  staffUserId: string,
  actorUserId: string
): Promise<DealerUser> {
  if (actorUserId === staffUserId) {
    throw new DealerStaffError(
      'FORBIDDEN',
      'Dealer admins cannot deactivate their own account from this flow'
    );
  }

  await assertInviterCanManageStaff(dealerId, actorUserId);

  const staffUser = await prisma.dealerUser.findUnique({
    where: { id: staffUserId },
  });

  if (!staffUser) {
    throw new DealerStaffError('NOT_FOUND', 'Staff account not found');
  }

  if (staffUser.dealerId !== dealerId) {
    throw new DealerStaffError(
      'FORBIDDEN',
      'You cannot deactivate a staff user from another dealership'
    );
  }

  if (staffUser.role !== 'DEALER_STAFF') {
    throw new DealerStaffError(
      'CONFLICT',
      'Only dealer staff accounts can be deactivated from this flow'
    );
  }

  if (staffUser.deactivatedAt) {
    return staffUser;
  }

  return prisma.dealerUser.update({
    where: { id: staffUser.id },
    data: {
      deactivatedAt: new Date(),
      inviteTokenHash: null,
      inviteExpiresAt: null,
    },
  });
}

export async function updateStaffRole(
  dealerId: string,
  staffUserId: string,
  newRole: Role,
  actorUserId: string
): Promise<{ updated: DealerUser; previousRole: Role }> {
  // Guard: actor cannot change their own role
  if (actorUserId === staffUserId) {
    throw new DealerStaffError('FORBIDDEN', 'You cannot change your own role');
  }

  // Verify actor is a DEALER_ADMIN for this dealer
  await assertInviterCanManageStaff(dealerId, actorUserId);

  // Fetch the staff member to verify they exist and belong to this dealer
  const staffUser = await prisma.dealerUser.findUnique({
    where: { id: staffUserId },
  });

  if (!staffUser) {
    throw new DealerStaffError('NOT_FOUND', 'Staff account not found');
  }

  // Verify staff member belongs to same dealer
  if (staffUser.dealerId !== dealerId) {
    throw new DealerStaffError(
      'FORBIDDEN',
      'You cannot update a staff user from another dealership'
    );
  }

  // Do not allow changing DEALER_ADMIN roles via this endpoint
  if (staffUser.role === 'DEALER_ADMIN') {
    throw new DealerStaffError(
      'FORBIDDEN',
      'Cannot change the role of a dealer admin from this flow'
    );
  }

  // Do not allow role changes on deactivated accounts
  if (staffUser.deactivatedAt) {
    throw new DealerStaffError(
      'FORBIDDEN',
      'Cannot change the role of a deactivated staff member'
    );
  }

  const previousRole = staffUser.role;

  // If role is already the same, return without updating
  if (staffUser.role === newRole) {
    return { updated: staffUser, previousRole };
  }

  // Update the role
  const updated = await prisma.dealerUser.update({
    where: { id: staffUserId },
    data: { role: newRole },
  });

  return { updated, previousRole };
}

export async function getActiveUserForPasswordSignIn(email: string) {
  const normalisedEmail = normaliseEmail(email);

  const dealerUser = await prisma.dealerUser.findFirst({
    where: {
      email: normalisedEmail,
      deactivatedAt: null,
    },
  });

  if (!dealerUser || !isAcceptedStaffUser(dealerUser)) {
    return null;
  }

  return dealerUser;
}
