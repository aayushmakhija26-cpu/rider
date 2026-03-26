import { requireAuth, AuthError } from '@/lib/auth/session';
import { updateDealerProfile } from '@/src/services/dealer.service';
import { profileSchema, type ProfileInput } from '@/src/schemas/profile';
import { auditService } from '@/src/services/audit.service';
import { ZodError } from 'zod';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ dealerId: string }> }
) {
  try {
    const session = await requireAuth(['DEALER_ADMIN']);
    const { dealerId } = await params;

    if (session.dealerId !== dealerId) {
      return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const validated: ProfileInput = profileSchema.parse(body);

    const dealer = await updateDealerProfile(session.dealerId, {
      name: validated.name,
      logoUrl: validated.logoUrl,
      primaryColour: validated.primaryColour,
      contactPhone: validated.contactPhone,
      contactEmail: validated.contactEmail,
      websiteUrl: validated.websiteUrl,
    });

    try {
      await auditService.log({
        action: 'dealer_profile_updated',
        actorId: session.userId,
        actorRole: session.role,
        dealerId: session.dealerId,
        targetId: session.dealerId,
        targetType: 'dealer',
      });
    } catch (auditError) {
      console.error('[dealers/profile/PATCH] audit log failed', auditError);
    }

    return Response.json({
      id: dealer.id,
      name: dealer.name,
      logoUrl: dealer.logoUrl,
      primaryColour: dealer.primaryColour,
      contactPhone: dealer.contactPhone,
      contactEmail: dealer.contactEmail,
      websiteUrl: dealer.websiteUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    if (error instanceof ZodError) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('[dealers/profile/PATCH]', error);
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
