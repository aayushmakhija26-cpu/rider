import Stripe from 'stripe';
import { getStripe } from '@/lib/payments/stripe';
import { getDealerByStripeCustomerId, updateDealerStripeSubscription } from '@/src/services/dealer.service';
import { auditService } from '@/src/services/audit.service';
import { NextRequest, NextResponse } from 'next/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handleDealerSubscriptionChange(subscription: Stripe.Subscription) {
  // P-2: subscription.customer may be an expanded Customer object — extract the ID safely
  const rawCustomer = subscription.customer;
  const customerId = typeof rawCustomer === 'string' ? rawCustomer : rawCustomer.id;

  const subscriptionId = subscription.id;
  const status = subscription.status;

  const dealer = await getDealerByStripeCustomerId(customerId);

  if (!dealer) {
    console.error('[webhook] Dealer not found for Stripe customer:', customerId);
    return;
  }

  let updateData: Parameters<typeof updateDealerStripeSubscription>[1];

  if (status === 'active' || status === 'trialing') {
    // P-16: Guard against empty items array
    const item = subscription.items.data[0];
    const product = item?.price?.product;
    const stripeProductId = typeof product === 'string' ? product : (product && 'id' in product ? product.id : null);
    const planName = typeof product === 'string' ? null : (product && 'name' in product ? (product as Stripe.Product).name : null);

    updateData = {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeProductId,
      planName,
      subscriptionStatus: status,
    };
  } else if (status === 'canceled' || status === 'unpaid') {
    updateData = {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status,
    };
  } else {
    updateData = { subscriptionStatus: status };
  }

  await updateDealerStripeSubscription(dealer.id, updateData);

  try {
    await auditService.log({
      action: 'subscription_status_changed',
      actorId: 'stripe-webhook',
      actorRole: 'SYSTEM',
      dealerId: dealer.id,
      targetId: dealer.id,
      targetType: 'Dealer',
      metadata: { subscriptionId, status },
    });
  } catch (auditError) {
    console.error('[webhook] audit log failed', auditError);
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      // P-6: Wrap in try/catch so DB errors return 200 to Stripe instead of causing retries
      try {
        await handleDealerSubscriptionChange(subscription);
      } catch (err) {
        console.error('[webhook] handleDealerSubscriptionChange failed', err);
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
