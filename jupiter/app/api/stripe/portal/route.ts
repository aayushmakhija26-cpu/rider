import { requireAuth, AuthError } from '@/lib/auth/session';
import { createDealerPortalSession } from '@/lib/payments/stripe';
import { prisma } from '@/src/lib/db';

export async function POST() {
  let session;
  try {
    session = await requireAuth(['DEALER_ADMIN']);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }
    return Response.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
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

  const portalSession = await createDealerPortalSession({
    stripeCustomerId: dealer.stripeCustomerId,
    returnUrl: `${process.env.BASE_URL}/settings/billing`,
  });

  return Response.json({ url: portalSession.url });
}
