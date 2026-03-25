import { getUser } from '@/lib/db/queries';
import { requireAuth, AuthError } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await requireAuth(['DEALER_ADMIN', 'DEALER_STAFF', 'CONSUMER']);
    const user = await getUser(session.userId);
    return Response.json(user);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === 'UNAUTHORIZED' ? 401 : 403;
      const message = error.code === 'UNAUTHORIZED' ? 'Unauthorized' : 'Forbidden';
      return Response.json({ error: message, code: error.code }, { status });
    }
    console.error('[user/GET]', error);
    return Response.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
