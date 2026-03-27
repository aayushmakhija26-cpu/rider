'use client';

import { useState } from 'react';
// Local types mirror the Prisma model until the client is regenerated
type OnboardingStatus = 'pending' | 'active' | 'complete' | 'skipped';
interface OnboardingStep {
  id: string;
  dealerId: string;
  stepName: string;
  status: OnboardingStatus;
  data: unknown;
  completedAt: Date | null;
  skippedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';
import { OnboardingCompletionBanner } from './OnboardingCompletionBanner';
import { BrandingStep } from './steps/BrandingStep';
import { DMSConnectionStep } from './steps/DMSConnectionStep';
import { StaffSetupStep } from './steps/StaffSetupStep';
import { BillingStep } from './steps/BillingStep';

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  onStepUpdate: (
    stepName: string,
    status: OnboardingStatus,
    data?: Record<string, unknown>
  ) => Promise<void>;
  dealerData?: {
    dealerId: string;
    stripeSubscriptionId: string | null;
    planName: string | null;
  };
}

const STEP_DISPLAY_NAMES: Record<string, string> = {
  branding: 'Brand Setup',
  dms: 'DMS Connection',
  staff: 'Staff Setup',
  billing: 'Billing Setup',
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  branding: 'Upload logo, set brand colors, and preview your branding',
  dms: 'Connect to your DMS to sync vehicle and customer data',
  staff: 'Invite team members and assign roles',
  billing: 'Complete Stripe subscription setup',
};

const STEP_ORDER = ['branding', 'dms', 'staff', 'billing'];

function getStatusBadgeColor(status: OnboardingStatus): string {
  switch (status) {
    case 'complete':
      return 'text-financial-positive';
    case 'active':
      return 'text-blue-600';
    case 'pending':
      return 'text-gray-500';
    case 'skipped':
      return 'text-gray-400';
    default:
      return 'text-gray-500';
  }
}

function getStatusBadgeText(status: OnboardingStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OnboardingChecklist({
  steps,
  onStepUpdate,
  dealerData,
}: OnboardingChecklistProps) {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Map steps by name for easy lookup
  const stepMap = new Map(steps.map((s) => [s.stepName, s]));

  // Ensure all required steps exist
  const allSteps = STEP_ORDER.map((stepName) => {
    return (
      stepMap.get(stepName) || {
        id: `temp-${stepName}`,
        dealerId: '',
        stepName,
        status: 'pending' as const,
        data: null,
        completedAt: null,
        skippedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  });

  const handleStepClick = (stepName: string) => {
    setActiveStep(activeStep === stepName ? null : stepName);
  };

  const handleStepComplete = async (stepName: string, data?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      await onStepUpdate(stepName, 'complete', data);
      // Keep step expanded to show completion feedback
    } catch (error) {
      console.error(`Failed to complete step ${stepName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const allStepsComplete = allSteps.every((s) => s.status === 'complete');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Setup Your Dealership
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete these steps to activate your account
          </p>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {allSteps.filter((s) => s.status === 'complete').length} of{' '}
          {allSteps.length} complete
        </div>
      </div>

      <div className="space-y-3">
        {allSteps.map((step) => (
          <Card
            key={step.stepName}
            className="overflow-hidden transition-shadow hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => handleStepClick(step.stepName)}
              disabled={isLoading}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      step.status === 'complete'
                        ? 'border-financial-positive bg-emerald-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {step.status === 'complete' ? (
                      <svg
                        className="h-6 w-6 text-financial-positive"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span
                        className={`text-sm font-semibold ${getStatusBadgeColor(step.status)}`}
                      >
                        {STEP_ORDER.indexOf(step.stepName) + 1}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3
                      className={`font-semibold ${
                        step.status === 'complete'
                          ? 'text-financial-positive'
                          : 'text-foreground'
                      }`}
                    >
                      {STEP_DISPLAY_NAMES[step.stepName]}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {STEP_DESCRIPTIONS[step.stepName]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      step.status === 'complete'
                        ? 'bg-emerald-50 text-financial-positive'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {getStatusBadgeText(step.status)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      activeStep === step.stepName ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
            </button>

            {activeStep === step.stepName && (
              <div className="border-t border-border bg-muted/30 p-4">
                <div className="space-y-4">
                  {step.stepName === 'branding' && (
                    <BrandingStep
                      status={step.status}
                      data={step.data as Record<string, unknown>}
                      onUpdate={(data) => handleStepComplete(step.stepName, data)}
                    />
                  )}
                  {step.stepName === 'dms' && (
                    <DMSConnectionStep
                      status={step.status}
                      data={step.data as Record<string, unknown>}
                      onUpdate={(data) => handleStepComplete(step.stepName, data)}
                    />
                  )}
                  {step.stepName === 'staff' && (
                    <StaffSetupStep
                      dealerId={step.dealerId}
                      status={step.status}
                      data={step.data as Record<string, unknown>}
                      onUpdate={(data) => handleStepComplete(step.stepName, data)}
                    />
                  )}
                  {step.stepName === 'billing' && (
                    <BillingStep
                      status={step.status}
                      data={step.data as Record<string, unknown>}
                      onUpdate={(data) => handleStepComplete(step.stepName, data)}
                      dealerData={dealerData}
                    />
                  )}

                  {step.status === 'complete' && (
                    <div className="flex items-center gap-2 text-financial-positive text-sm font-medium">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Step completed
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {allStepsComplete && (
        <div className="mt-6">
          <OnboardingCompletionBanner />
        </div>
      )}
    </div>
  );
}
