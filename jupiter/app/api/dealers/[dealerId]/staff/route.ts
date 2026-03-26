import { requireAuth, AuthError } from '@/lib/auth/session';
import {
  createPendingStaffInvite,
  listDealerStaff,
  DealerStaffError,
} from '@/src/services/dealerStaff.service';
import { createStaffInviteSchema } from '@/src/schemas/staff';
import { auditService } from '@/src/services/audit.service';
import { ZodError } from 'zod';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealerId: string }> }
) {
  try {
    const session = await requireAuth(['DEALER_ADMIN']);
    const { dealerId } = await params;

    if (session.dealerId !== dealerId) {
      return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const staff = await listDealerStaff(dealerId);
    return Response.json({ staff });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    console.error('[staff/GET]', error);
    return Response.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealerId: string }> }
) {
  try {
    const session = await requireAuth(['DEALER_ADMIN']);
    const { dealerId } = await params;

    if (session.dealerId !== dealerId) {
      return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const { email } = createStaffInviteSchema.parse(body);

    const result = await createPendingStaffInvite(dealerId, email, session.userId);

    await auditService.log({
      action: 'staff_invite_created',
      actorId: session.userId,
      actorRole: session.role,
      dealerId,
      targetId: result.id,
      targetType: 'DealerUser',
      metadata: { email, inviteMode: result.inviteMode },
    });

    return Response.json(result, { status: result.inviteMode === 'created' ? 201 : 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof DealerStaffError) {
      const status =
        error.code === 'CONFLICT' ? 409
        : error.code === 'FORBIDDEN' ? 403
        : 400;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    console.error('[staff/POST]', error);
    return Response.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
