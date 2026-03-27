import { getSession, AuthError } from '@/lib/auth/session';
import { prisma } from '@/src/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basial',
});

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthError('UNAUTHORIZED', 'No session found');
    }

    if (session.role !== 'DEALER_ADMIN') {
      throw new AuthError('FORBIDDEN', 'Only DEALER_ADMIN can access this');
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id: session.dealerId },
      select: { stripeCustomerId: true },
    });

    if (!dealer?.stripeCustomerId) {
      return Response.json(
        { error: 'No billing setup found. Please complete billing setup first.', code: 'NO_STRIPE_CUSTOMER' },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dealer.stripeCustomerId,
      return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/dealer/onboarding`,
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    console.error('Portal error:', error);
    return Response.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
