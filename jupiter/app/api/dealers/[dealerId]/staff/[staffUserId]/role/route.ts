import { requireAuth, AuthError } from '@/lib/auth/session';
import { updateStaffRole, DealerStaffError } from '@/src/services/dealerStaff.service';
import { auditService } from '@/src/services/audit.service';
import { z } from 'zod';

const UpdateRoleRequestSchema = z.object({
  newRole: z.enum(['DEALER_STAFF', 'DEALER_ADMIN']),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ dealerId: string; staffUserId: string }> }
) {
  try {
    const session = await requireAuth(['DEALER_ADMIN']);
    const { dealerId, staffUserId } = await params;

    if (!session.dealerId || session.dealerId !== dealerId) {
      return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    // Parse and validate request body — guard against malformed JSON
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    const validated = UpdateRoleRequestSchema.parse(body);

    const { updated: staffUser, previousRole } = await updateStaffRole(
      dealerId,
      staffUserId,
      validated.newRole,
      session.userId
    );

    // Audit log is best-effort: a logging failure must not roll back a committed role change
    try {
      await auditService.log({
        action: 'staff_role_changed',
        actorId: session.userId,
        actorRole: session.role,
        dealerId,
        targetId: staffUser.id,
        targetType: 'DealerUser',
        metadata: {
          previousRole,
          newRole: staffUser.role,
        },
      });
    } catch (auditError) {
      console.error('[role/PATCH] audit log failed', auditError);
    }

    return Response.json({
      id: staffUser.id,
      role: staffUser.role,
      email: staffUser.email,
      name: staffUser.name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
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
    console.error('[role/PATCH]', error);
    return Response.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
