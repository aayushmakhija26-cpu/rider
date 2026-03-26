import {
  getStaffInviteState,
  acceptStaffInvite,
  DealerStaffError,
} from '@/src/services/dealerStaff.service';
import { acceptStaffInviteSchema } from '@/src/schemas/staff';
import { hashPassword, setSession } from '@/lib/auth/session';
import { auditService } from '@/src/services/audit.service';
import { ZodError } from 'zod';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const state = await getStaffInviteState(token);
  return Response.json(state);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { name, password } = acceptStaffInviteSchema.parse(body);

    // Hash password before service call — bcrypt is CPU-bound, keep DB transaction short
    const passwordHash = await hashPassword(password);

    const staffUser = await acceptStaffInvite(token, name, passwordHash);

    await auditService.log({
      action: 'staff_invite_accepted',
      actorId: staffUser.id,
      actorRole: staffUser.role,
      dealerId: staffUser.dealerId,
      targetId: staffUser.id,
      targetType: 'DealerUser',
    });

    await setSession(staffUser);

    return Response.json(
      { id: staffUser.id, dealerId: staffUser.dealerId, role: staffUser.role },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof DealerStaffError) {
      const status =
        error.code === 'INVITE_EXPIRED' ? 410
        : error.code === 'INVALID_INVITE' ? 404
        : 422;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    console.error('[staff-invites/POST]', error);
    return Response.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
