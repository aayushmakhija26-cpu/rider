import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { DealerUser, Role } from '@prisma/client';
import { prisma } from '@/src/lib/db';

const SALT_ROUNDS = 10;

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set');
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string | null | undefined
) {
  if (!hashedPassword) return false;
  return compare(plainTextPassword, hashedPassword);
}

export type SessionData = {
  userId: string;
  role: Role;
  dealerId: string;
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(getKey());
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, getKey(), {
    algorithms: ['HS256'],
  });
  if (
    typeof payload.userId !== 'string' ||
    typeof payload.role !== 'string' ||
    typeof payload.dealerId !== 'string' ||
    typeof payload.expires !== 'string'
  ) {
    throw new Error('Invalid session payload shape');
  }
  return payload as SessionData;
}

export async function createSessionCookie(
  user: Pick<DealerUser, 'id' | 'role' | 'dealerId'>
) {
  if (!user.dealerId) {
    throw new Error('Cannot create session: dealerId is required');
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    userId: user.id,
    role: user.role,
    dealerId: user.dealerId,
    expires: expiresAt.toISOString(),
  };

  return {
    expiresAt,
    token: await signToken(session),
  };
}

async function validateSessionData(
  session: SessionData
): Promise<SessionData | null> {
  try {
    const dealerUser = await prisma.dealerUser.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        dealerId: true,
        role: true,
        acceptedAt: true,
        deactivatedAt: true,
        inviteExpiresAt: true,
      },
    }) as {
      id: string;
      dealerId: string;
      role: Role;
      acceptedAt: Date | null;
      deactivatedAt: Date | null;
      inviteExpiresAt: Date | null;
    } | null;

    if (!dealerUser) {
      return null;
    }

    // Check dealerId matches
    if (dealerUser.dealerId !== session.dealerId) {
      return null;
    }

    // Check user is not deactivated (past or present)
    if (dealerUser.deactivatedAt && dealerUser.deactivatedAt <= new Date()) {
      return null;
    }

    // For DEALER_STAFF: must be accepted
    if (dealerUser.role === 'DEALER_STAFF' && dealerUser.acceptedAt === null) {
      return null;
    }

    // For DEALER_STAFF: invite must not be expired
    if (
      dealerUser.role === 'DEALER_STAFF' &&
      dealerUser.inviteExpiresAt &&
      dealerUser.inviteExpiresAt <= new Date()
    ) {
      return null;
    }

    return {
      ...session,
      dealerId: dealerUser.dealerId,
      role: dealerUser.role,
      userId: dealerUser.id,
    };
  } catch (error) {
    // Log database errors but don't expose them to the client
    console.error('[auth] validateSessionData failed:', error);
    return null;
  }
}

export async function validateSessionCookieValue(
  cookieValue: string
): Promise<SessionData | null> {
  try {
    const session = await verifyToken(cookieValue);
    return await validateSessionData(session);
  } catch {
    return null;
  }
}

export class AuthError extends Error {
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  constructor(code: 'UNAUTHORIZED' | 'FORBIDDEN', message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;
  return validateSessionCookieValue(sessionCookie);
}

/**
 * Get the current session and verify the caller has one of the allowed roles.
 * Use in API Route Handlers before any service call.
 *
 * @throws AuthError('UNAUTHORIZED') if no valid session
 * @throws AuthError('FORBIDDEN') if role not in allowedRoles
 */
export async function requireAuth(allowedRoles: Role[]): Promise<SessionData> {
  const session = await getSession();
  if (!session) throw new AuthError('UNAUTHORIZED');
  if (!allowedRoles.includes(session.role)) throw new AuthError('FORBIDDEN');
  return session;
}

export async function setSession(user: DealerUser) {
  const { expiresAt, token } = await createSessionCookie(user);
  try {
    (await cookies()).set('session', token, {
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  } catch (error) {
    console.error('[auth] Failed to set session cookie:', error);
    throw new Error('Failed to establish session. Please try again.');
  }
}
