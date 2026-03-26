import { requireAuth } from '@/lib/auth/session';
import { updateStep } from '@/src/services/onboardingStep.service';
import { onboardingStepSchema } from '@/src/schemas/onboarding';
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
    const validated = onboardingStepSchema.parse(body);

    // Update step in database
    const step = await updateStep(
      session.dealerId,
      validated.stepName,
      validated.status,
      validated.data
    );

    return Response.json(step, { status: 200 });
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

    return Response.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
