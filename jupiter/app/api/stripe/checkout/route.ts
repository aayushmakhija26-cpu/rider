// Stub implementation for Story 1.1
// Full Prisma-based implementation will be added in Story 2.6 (Stripe billing)

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(['DEALER_ADMIN']);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === 'UNAUTHORIZED' ? 401 : 403;
      const message = error.code === 'UNAUTHORIZED' ? 'Unauthorized' : 'Forbidden';
      return Response.json({ error: message, code: error.code }, { status });
    }
    return Response.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
  return NextResponse.redirect(new URL('/pricing', request.url));
}
