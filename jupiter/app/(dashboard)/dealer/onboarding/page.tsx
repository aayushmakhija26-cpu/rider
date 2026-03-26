import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getSteps } from '@/src/services/onboardingStep.service';
import { OnboardingChecklistClient } from '@/components/dealer/OnboardingChecklistClient';

export default async function OnboardingPage() {
  // Verify session and DEALER_ADMIN role
  const session = await getSession();
  if (!session) {
    redirect('/dealer/sign-in');
  }
  if (session.role !== 'DEALER_ADMIN') {
    redirect('/unauthorized');
  }

  // Load all onboarding steps for the dealer
  const steps = await getSteps(session.dealerId);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <OnboardingChecklistClient initialSteps={steps} />
      </div>
    </div>
  );
}
