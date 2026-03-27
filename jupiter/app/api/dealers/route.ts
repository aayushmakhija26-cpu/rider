import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dealerRegistrationSchema } from '@/src/schemas/registration';
import { createDealerWithAdmin, findUserByEmail } from '@/src/services/dealer.service';
import { auditService } from '@/src/services/audit.service';
import { hashPassword, signToken } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    // CSRF protection: validate Content-Type and Origin headers
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.startsWith('application/json')) {
      return Response.json(
        { error: 'Unsupported media type', code: 'UNSUPPORTED_MEDIA_TYPE' },
        { status: 415 }
      );
    }
    const origin = req.headers.get('origin');
    if (origin !== null && origin !== (process.env.BASE_URL ?? '')) {
      return Response.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = dealerRegistrationSchema.parse(body);

    // Check for existing email across all dealers
    const existingUser = await findUserByEmail(validatedData.email);
    if (existingUser) {
      return Response.json(
        { error: 'An account already exists. Please sign in.', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create dealer and admin user in a transaction
    const { dealer, user } = await createDealerWithAdmin(
      validatedData.email,
      validatedData.dealershipName,
      passwordHash
    );

    // Log registration action
    await auditService.log({
      action: 'dealer_registration',
      actorId: user.id,
      actorRole: user.role,
      dealerId: dealer.id,
      targetId: dealer.id,
      targetType: 'Dealer',
      metadata: { dealershipName: validatedData.dealershipName.slice(0, 100) },
    });

    // Calculate expiry once for both token payload and cookie
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create JWT session token
    const token = await signToken({
      userId: user.id,
      role: user.role,
      dealerId: dealer.id,
      expires: expiresAt.toISOString(),
    });

    // Return success response with user data and session token
    const response = NextResponse.json(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        dealerId: dealer.id,
      },
      { status: 201 }
    );

    // Set session cookie (httpOnly, secure in production)
    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    // Prisma unique constraint violation — race condition on duplicate email
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return Response.json(
        { error: 'An account already exists. Please sign in.', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    console.error('[dealers/POST]', error);
    if (error instanceof Error) {
      console.error('[dealers/POST] Error message:', error.message);
      console.error('[dealers/POST] Error stack:', error.stack);
    }
    return Response.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
