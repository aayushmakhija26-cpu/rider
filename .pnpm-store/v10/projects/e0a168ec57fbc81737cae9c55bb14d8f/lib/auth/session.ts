import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { DealerUser, Role } from '@prisma/client';

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

export async function getSession(): Promise<SessionData | null> {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  try {
    return await verifyToken(session);
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
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    userId: user.id,
    role: user.role,
    dealerId: user.dealerId,
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
