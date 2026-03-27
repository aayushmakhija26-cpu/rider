'use server';

import { redirect } from 'next/navigation';
import { getSession, AuthError } from '@/lib/auth/session';
import { prisma } from '@/src/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Get or create Stripe customer for dealer
async function getOrCreateStripeCustomer(dealerId: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
  });

  if (!dealer) {
    throw new Error('Dealer not found');
  }

  if (dealer.stripeCustomerId) {
    return dealer.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: dealer.email,
    metadata: {
      dealerId,
      dealerName: dealer.name,
    },
  });

  // Save customer ID
  await prisma.dealer.update({
    where: { id: dealerId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function startCheckout() {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthError('UNAUTHORIZED', 'No session found');
    }

    if (session.role !== 'DEALER_ADMIN') {
      throw new AuthError('FORBIDDEN', 'Only DEALER_ADMIN can set up billing');
    }

    console.log('[startCheckout] Starting checkout for dealer:', session.dealerId);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(session.dealerId);
    console.log('[startCheckout] Customer ID:', customerId);

    // Get the default pricing (Starter plan)
    // In production, you'd fetch this from Stripe or a config
    console.log('[startCheckout] Fetching pricing plans...');
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring',
      limit: 5,
    });

    console.log('[startCheckout] Found prices:', prices.data.map(p => ({ id: p.id, product: p.product })));

    if (prices.data.length === 0) {
      throw new Error('No pricing plans available in Stripe');
    }

    const priceId = prices.data[0].id;
    console.log('[startCheckout] Using price ID:', priceId);

    // Create checkout session
    console.log('[startCheckout] Creating checkout session...');
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/dealer/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/dealer/onboarding`,
      allow_promotion_codes: true,
    });

    console.log('[startCheckout] Checkout session created:', checkoutSession.id, 'URL:', checkoutSession.url);

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session - no URL returned');
    }

    redirect(checkoutSession.url);
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('[startCheckout] Auth error:', error.code, error.message);
      throw new Error(`${error.code}: ${error.message}`);
    }
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors
    }
    console.error('[startCheckout] Error:', error);
    throw error;
  }
}

export async function syncSubscriptionData(dealerId: string) {
  try {
    const session = await getSession();
    if (!session) {
      console.log('[syncSubscriptionData] No session found');
      throw new AuthError('UNAUTHORIZED', 'No session found');
    }

    if (session.role !== 'DEALER_ADMIN') {
      console.log('[syncSubscriptionData] User is not DEALER_ADMIN:', session.role);
      throw new AuthError('FORBIDDEN', 'Only DEALER_ADMIN can access this');
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    console.log('[syncSubscriptionData] Dealer found:', dealer?.id, 'stripeCustomerId:', dealer?.stripeCustomerId);

    if (!dealer || !dealer.stripeCustomerId) {
      console.log('[syncSubscriptionData] No dealer or stripeCustomerId found');
      return null;
    }

    // Fetch subscriptions from Stripe for this customer
    console.log('[syncSubscriptionData] Fetching subscriptions for customer:', dealer.stripeCustomerId);
    const subscriptions = await stripe.subscriptions.list({
      customer: dealer.stripeCustomerId,
      status: 'all',
      limit: 10,
    });

    console.log('[syncSubscriptionData] Found subscriptions:', subscriptions.data.length);

    if (subscriptions.data.length === 0) {
      console.log('[syncSubscriptionData] No subscriptions found for this customer');
      return null;
    }

    const subscription = subscriptions.data[0];
    const status = subscription.status;

    console.log('[syncSubscriptionData] Latest subscription status:', status, 'ID:', subscription.id);

    if (status === 'active' || status === 'trialing') {
      const plan = subscription.items.data[0]?.plan;
      let productId = null;
      let planName = null;

      if (plan?.product) {
        const product = plan.product;
        productId = typeof product === 'string' ? product : product?.id ?? null;

        // If product is a string ID, we need to fetch the full product to get the name
        if (typeof product === 'string') {
          try {
            const fullProduct = await stripe.products.retrieve(product);
            planName = fullProduct.name;
            console.log('[syncSubscriptionData] Fetched product name from Stripe:', planName);
          } catch (err) {
            console.error('[syncSubscriptionData] Failed to fetch product:', err);
          }
        } else if (product && 'name' in product) {
          planName = product.name;
        }
      }

      console.log('[syncSubscriptionData] Plan ID:', plan?.id, 'Product ID:', productId, 'Plan Name:', planName);

      const updated = await prisma.dealer.update({
        where: { id: dealerId },
        data: {
          stripeSubscriptionId: subscription.id,
          stripeProductId: productId,
          planName: planName,
          subscriptionStatus: status,
        },
        select: {
          stripeSubscriptionId: true,
          planName: true,
        },
      });

      console.log('[syncSubscriptionData] Updated dealer:', updated);
      return updated;
    } else if (status === 'canceled' || status === 'unpaid') {
      // Subscription was cancelled or is unpaid - clear the subscription data
      console.log('[syncSubscriptionData] Subscription was cancelled/unpaid, clearing data');

      const updated = await prisma.dealer.update({
        where: { id: dealerId },
        data: {
          stripeSubscriptionId: null,
          stripeProductId: null,
          planName: null,
          subscriptionStatus: status,
        },
        select: {
          stripeSubscriptionId: true,
          planName: true,
        },
      });

      console.log('[syncSubscriptionData] Cleared subscription data:', updated);
      return updated;
    }

    console.log('[syncSubscriptionData] Subscription status is not active/trialing/canceled/unpaid:', status);
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('[syncSubscriptionData] Auth error:', error.code, error.message);
      throw new Error(`${error.code}: ${error.message}`);
    }
    console.error('[syncSubscriptionData] Error:', error);
    return null;
  }
}

export async function openCustomerPortal() {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthError('UNAUTHORIZED', 'No session found');
    }

    if (session.role !== 'DEALER_ADMIN') {
      throw new AuthError('FORBIDDEN', 'Only DEALER_ADMIN can manage subscription');
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id: session.dealerId },
    });

    if (!dealer || !dealer.stripeCustomerId) {
      throw new Error('No subscription found');
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dealer.stripeCustomerId,
      return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/dealer/onboarding`,
    });

    if (!portalSession.url) {
      throw new Error('Failed to create portal session');
    }

    redirect(portalSession.url);
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error(`${error.code}: ${error.message}`);
    }
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors
    }
    console.error('openCustomerPortal error:', error);
    throw error;
  }
}
