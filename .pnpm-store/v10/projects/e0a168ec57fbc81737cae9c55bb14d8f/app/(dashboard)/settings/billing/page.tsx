import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/src/lib/db';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';
import { SetupBillingButton } from './SetupBillingButton';

export default async function BillingSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/dealer/sign-in');
  }
  if (session.role !== 'DEALER_ADMIN') {
    redirect('/unauthorized');
  }

  const dealer = await prisma.dealer.findUnique({
    where: { id: session.dealerId },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      planName: true,
      subscriptionStatus: true,
    },
  });

  const hasSubscription = !!dealer?.stripeSubscriptionId;
  const isActive =
    dealer?.subscriptionStatus === 'active' || dealer?.subscriptionStatus === 'trialing';

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your subscription and billing details.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Plan</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {dealer?.planName ?? 'No plan'}
              </p>
            </div>
            {hasSubscription && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {dealer?.subscriptionStatus ?? 'unknown'}
              </span>
            )}
          </div>

          {/* P-9: Use checkout flow directly instead of redirecting to onboarding */}
          {hasSubscription ? (
            <ManageSubscriptionButton />
          ) : (
            <SetupBillingButton />
          )}
        </div>
      </div>
    </div>
  );
}
