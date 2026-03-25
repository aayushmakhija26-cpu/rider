'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import type { Role } from '@prisma/client';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';
import {
  hashPassword,
  comparePasswords,
  setSession,
} from '@/lib/auth/session';
import { prisma } from '@/src/lib/db';

// Helper: derive a dealer name from an email domain
// e.g. "admin@honda.com" → "Honda Auto"
function deriveNameFromEmail(email: string): string {
  const domain = email.split('@')[1] ?? 'My Dealership';
  const name = domain.split('.')[0] ?? 'My Dealership';
  return name.charAt(0).toUpperCase() + name.slice(1) + ' Auto';
}

// Helper: get the role-appropriate redirect path (Story 1.5 will extend this)
function getRoleRedirect(_role: Role): string {
  return '/dashboard';
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, _formData) => {
  const dealerUser = await prisma.dealerUser.findFirst({
    where: { email: data.email },
  });

  if (!dealerUser || !dealerUser.passwordHash) {
    return { error: 'Invalid credentials' };
  }

  const passwordValid = await comparePasswords(data.password, dealerUser.passwordHash);
  if (!passwordValid) {
    return { error: 'Invalid credentials' };
  }

  await setSession(dealerUser);
  redirect(getRoleRedirect(dealerUser.role));
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, _formData) => {
  // Compute hash before opening the transaction — bcrypt is CPU-bound (~100ms)
  // and holding a DB connection open for it risks pool exhaustion under load.
  const passwordHash = await hashPassword(data.password);

  let dealerUser;
  try {
    dealerUser = await prisma.$transaction(async (tx) => {
      const dealer = await tx.dealer.create({
        data: {
          name: deriveNameFromEmail(data.email),
          email: data.email,
        },
      });
      return tx.dealerUser.create({
        data: {
          dealerId: dealer.id,
          email: data.email,
          passwordHash,
          role: 'DEALER_ADMIN',
        },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { error: 'An account with this email already exists' };
    }
    throw e;
  }

  await setSession(dealerUser);
  redirect(getRoleRedirect(dealerUser.role));
});

export async function signOut() {
  const { cookies } = await import('next/headers');
  (await cookies()).delete('session');
  redirect('/sign-in');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    if (data.newPassword !== data.confirmPassword) {
      return { error: 'Passwords do not match' };
    }

    const dealerUser = await prisma.dealerUser.findUnique({
      where: { id: user.id },
    });

    if (!dealerUser || !dealerUser.passwordHash) {
      return { error: 'User not found' };
    }

    const passwordValid = await comparePasswords(
      data.currentPassword,
      dealerUser.passwordHash
    );
    if (!passwordValid) {
      return { error: 'Current password is incorrect' };
    }

    await prisma.dealerUser.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(data.newPassword) },
    });

    return { success: 'Password updated successfully' };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (_data, _, _user) => {
    return { error: 'Not yet implemented.' };
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, _user) => {
    return { name: data.name, success: 'Not yet implemented.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.number(),
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (_data, _, _user) => {
    return { error: 'Not yet implemented.' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner']),
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (_data, _, _user) => {
    return { error: 'Not yet implemented.' };
  }
);
