import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handleDealerSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // Find dealer by Stripe customer ID
  const dealer = await prisma.dealer.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dealer) {
    console.error('Dealer not found for Stripe customer:', customerId);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    let productId = null;
    let planName = null;

    if (plan?.product) {
      const product = plan.product;
      productId = typeof product === 'string' ? product : product?.id ?? null;

      // If product is a string ID, fetch the full product to get the name
      if (typeof product === 'string') {
        try {
          const fullProduct = await stripe.products.retrieve(product);
          planName = fullProduct.name;
        } catch (err) {
          console.error('Failed to fetch product:', err);
        }
      } else if (product && 'name' in product) {
        planName = product.name;
      }
    }

    await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripeProductId: productId,
        planName: planName,
        subscriptionStatus: status,
      },
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: status,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await handleDealerSubscriptionChange(subscription);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
