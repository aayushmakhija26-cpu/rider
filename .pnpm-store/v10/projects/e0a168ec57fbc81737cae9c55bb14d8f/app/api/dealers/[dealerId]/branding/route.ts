import { requireAuth } from '@/lib/auth/session';
import { updateBranding } from '@/src/services/dealer.service';
import { brandingSchema } from '@/src/schemas/branding';
import { getSafeColour } from '@/src/lib/contrast';
import { ZodError } from 'zod';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealerId: string }> }
) {
  try {
    // Verify authentication and role
    const session = await requireAuth(['DEALER_ADMIN']);
    const { dealerId } = await params;

    // Verify dealerId matches session (RBAC check)
    if (session.dealerId !== dealerId) {
      return Response.json(
        {
          error: 'Unauthorized to access this dealer',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validated = brandingSchema.parse(body);

    // Apply contrast fallback to primaryColour if provided
    const safeColour = validated.primaryColour
      ? getSafeColour(validated.primaryColour)
      : undefined;

    // Update dealer branding
    const dealer = await updateBranding(
      session.dealerId,
      validated.logoUrl || undefined,
      safeColour,
      validated.contactPhone || undefined,
      validated.contactEmail || undefined,
      validated.websiteUrl || undefined
    );

    // Return only branding fields
    return Response.json(
      {
        id: dealer.id,
        logoUrl: dealer.logoUrl,
        primaryColour: dealer.primaryColour,
        contactPhone: dealer.contactPhone,
        contactEmail: dealer.contactEmail,
        websiteUrl: dealer.websiteUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return Response.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('FORBIDDEN')) {
      return Response.json(
        {
          error: 'Forbidden',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    console.error('[branding/POST]', error);
    return Response.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
