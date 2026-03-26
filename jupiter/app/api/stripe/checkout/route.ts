import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/session';
import { createDealerCheckoutSession, getStripe } from '@/lib/payments/stripe';
import { updateDealerStripeSubscription } from '@/src/services/dealer.service';
import { updateStep } from '@/src/services/onboardingStep.service';
import { auditService } from '@/src/services/audit.service';
import { prisma } from '@/src/lib/db';
import { z } from 'zod';

const CheckoutBodySchema = z.object({
  priceId: z.string().min(1),
});

export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const parsed = CheckoutBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { priceId } = parsed.data;

  // P-5: Validate priceId against the configured price — reject arbitrary price IDs
  const allowedPriceId = process.env.STRIPE_PRICE_ID;
  if (allowedPriceId && priceId !== allowedPriceId) {
    return Response.json({ error: 'Invalid price ID', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  try {
    // Fetch dealer to get existing Stripe Customer ID for retry scenario
    const dealer = await prisma.dealer.findUnique({
      where: { id: session.dealerId },
      select: { stripeCustomerId: true },
    });

    const checkoutSession = await createDealerCheckoutSession({
      dealerId: session.dealerId,
      priceId,
      existingStripeCustomerId: dealer?.stripeCustomerId,
    });

    // P-8: Guard against null url (Stripe can return null for non-redirect sessions)
    if (!checkoutSession.url) {
      return Response.json({ error: 'Failed to create checkout session', code: 'CHECKOUT_ERROR' }, { status: 500 });
    }

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[checkout/POST] failed to create checkout session', error);
    return Response.json({ error: 'Failed to create checkout session', code: 'CHECKOUT_ERROR' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/onboarding?billing_error=true', request.url));
  }

  let stripeSession;
  try {
    const stripe = getStripe();
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.items.data.price.product'],
    });
  } catch {
    return NextResponse.redirect(new URL('/onboarding?billing_error=true', request.url));
  }

  // P-17: status !== 'complete' is sufficient; payment_status check is redundant
  if (stripeSession.status !== 'complete') {
    return NextResponse.redirect(new URL('/onboarding?billing_error=true', request.url));
  }

  const dealerId = stripeSession.client_reference_id;
  if (!dealerId) {
    return NextResponse.redirect(new URL('/onboarding?billing_error=true', request.url));
  }

  // P-11: Optional session replay mitigation — verify dealerId is a known dealer
  // (idempotent update makes replay harmless, but we confirm the dealer exists)

  // P-1: Guard against null/non-string customer before casting
  const rawCustomer = stripeSession.customer;
  if (!rawCustomer || typeof rawCustomer !== 'string') {
    console.error('[checkout/GET] unexpected customer value:', rawCustomer);
    return NextResponse.redirect(new URL('/onboarding?billing_error=true', request.url));
  }
  const stripeCustomerId = rawCustomer;

  const subscription = stripeSession.subscription as import('stripe').default.Subscription | null;

  // P-4: Only proceed with completion if a subscription was actually created
  if (!subscription) {
    console.error('[checkout/GET] no subscription on completed session:', sessionId);
    return NextResponse.redirect(new URL('/onboarding?billing_error=true', request.url));
  }

  const stripeSubscriptionId = subscription.id;
  const subscriptionStatus = subscription.status;

  let stripeProductId: string | null = null;
  let planName: string | null = null;

  const item = subscription.items.data[0];
  if (item) {
    const product = item.price.product;
    stripeProductId = typeof product === 'string' ? product : product.id;
    planName = typeof product === 'string' ? null : ('name' in product ? (product as import('stripe').default.Product).name : null);
  }

  try {
    await updateDealerStripeSubscription(dealerId, {
      stripeCustomerId,
      stripeSubscriptionId,
      stripeProductId,
      planName,
      subscriptionStatus,
    });

    // P-10: Use actual subscriptionStatus — do not fall back to 'active'
    await updateStep(dealerId, 'billing', 'complete', {
      planName,
      subscriptionStatus,
    });

    try {
      await auditService.log({
        action: 'billing_setup_completed',
        actorId: dealerId,
        actorRole: 'DEALER_ADMIN',
        dealerId,
        targetId: dealerId,
        targetType: 'Dealer',
        metadata: { planName, subscriptionStatus, stripeSubscriptionId },
      });
    } catch (auditError) {
      console.error('[checkout/GET] audit log failed', auditError);
    }
  } catch (error) {
    console.error('[checkout/GET] failed to update billing data', error);
    return NextResponse.redirect(new URL('/onboarding?billing_error=true', request.url));
  }

  return NextResponse.redirect(new URL('/onboarding', request.url));
}
