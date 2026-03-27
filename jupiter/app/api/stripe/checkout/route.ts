import { NextRequest, NextResponse } from 'next/server';
import { getSession, AuthError } from '@/lib/auth/session';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basial',
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthError('UNAUTHORIZED', 'No session found');
    }

    if (session.role !== 'DEALER_ADMIN') {
      throw new AuthError('FORBIDDEN', 'Only DEALER_ADMIN can access this');
    }

    const sessionId = request.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.redirect(new URL('/dealer/onboarding', request.url));
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status === 'paid') {
      // Redirect back to onboarding - the webhook will handle updating dealer data
      return NextResponse.redirect(new URL('/dealer/onboarding', request.url));
    } else {
      // Payment not completed, redirect back to onboarding
      return NextResponse.redirect(new URL('/dealer/onboarding', request.url));
    }
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === 'UNAUTHORIZED' ? 401 : 403;
      const message = error.code === 'UNAUTHORIZED' ? 'Unauthorized' : 'Forbidden';
      return Response.json({ error: message, code: error.code }, { status });
    }
    console.error('Checkout error:', error);
    return Response.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
