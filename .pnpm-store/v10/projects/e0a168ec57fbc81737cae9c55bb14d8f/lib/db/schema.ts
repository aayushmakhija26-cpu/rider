import type { Role } from '@prisma/client';

// Story 1.2 migration note:
// New application types should use '@prisma/client' directly:
//   import type { Dealer, DealerUser, Consumer, Role } from '@prisma/client'
//
// The types below are template stubs from Story 1.1 that are retained for
// build compatibility with template UI files. They will be replaced story by
// story as each feature is implemented using real Prisma models.

export type User = {
  id: string; // Story 1.3: id updated to string to match Prisma DealerUser cuid()
  name: string | null;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export type NewUser = {
  id?: string; // Story 1.3: id updated to string to match Prisma DealerUser cuid()
  name?: string | null;
  email: string;
  passwordHash: string;
  role: string;
};

export type Team = {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
};

export type TeamMember = {
  id: number;
  userId: string; // Story 1.3: updated to string to match Prisma DealerUser cuid()
  teamId: number;
  role: string;
  joinedAt?: Date;
};

export type TeamDataWithMembers = Team & {
  teamMembers: Array<
    TeamMember & {
      user: Pick<User, 'id' | 'name' | 'email'>;
    }
  >;
};

export type ActivityLog = {
  id: number;
  teamId: number;
  userId: number | null;
  action: string;
  timestamp: Date;
  ipAddress: string | null;
};

export type NewActivityLog = {
  teamId: number;
  userId: number;
  action: string;
  ipAddress?: string;
};

export type Invitation = {
  id: number;
  teamId: number;
  email: string;
  role: string;
  invitedBy: number;
  invitedAt: Date;
  status: string;
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
