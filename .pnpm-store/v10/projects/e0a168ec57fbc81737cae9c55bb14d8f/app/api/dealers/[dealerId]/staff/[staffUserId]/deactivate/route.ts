import { requireAuth, AuthError } from '@/lib/auth/session';
import { deactivateStaffAccount, DealerStaffError } from '@/src/services/dealerStaff.service';
import { auditService } from '@/src/services/audit.service';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ dealerId: string; staffUserId: string }> }
) {
  try {
    const session = await requireAuth(['DEALER_ADMIN']);
    const { dealerId, staffUserId } = await params;

    if (session.dealerId !== dealerId) {
      return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const staffUser = await deactivateStaffAccount(dealerId, staffUserId, session.userId);

    await auditService.log({
      action: 'staff_deactivated',
      actorId: session.userId,
      actorRole: session.role,
      dealerId,
      targetId: staffUser.id,
      targetType: 'DealerUser',
    });

    return Response.json({ id: staffUser.id, deactivatedAt: staffUser.deactivatedAt });
  } catch (error) {
    if (error instanceof DealerStaffError) {
      const status =
        error.code === 'FORBIDDEN' ? 403
        : error.code === 'NOT_FOUND' ? 404
        : 400;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    console.error('[deactivate/POST]', error);
    return Response.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
