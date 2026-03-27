import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getSteps } from '@/src/services/onboardingStep.service';
import { prisma } from '@/src/lib/db';
import { syncSubscriptionData } from '@/app/actions/billing';
import { OnboardingChecklistClient } from '@/components/dealer/OnboardingChecklistClient';

export default async function OnboardingPage() {
  // Verify session and DEALER_ADMIN role
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }
  if (session.role !== 'DEALER_ADMIN') {
    redirect('/unauthorized');
  }

  // Load all onboarding steps for the dealer
  const steps = await getSteps(session.dealerId);

  // Sync subscription data from Stripe (in case webhook didn't fire)
  await syncSubscriptionData(session.dealerId);

  // Load dealer data for billing step
  const dealer = await prisma.dealer.findUnique({
    where: { id: session.dealerId },
    select: {
      id: true,
      stripeSubscriptionId: true,
      planName: true,
    },
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <OnboardingChecklistClient
          initialSteps={steps}
          dealerData={{
            dealerId: dealer?.id || '',
            stripeSubscriptionId: dealer?.stripeSubscriptionId || null,
            planName: dealer?.planName || null,
          }}
        />
      </div>
    </div>
  );
}
