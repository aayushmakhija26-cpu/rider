'use client';

import { useState } from 'react';
import type { OnboardingStep, OnboardingStatus } from '@prisma/client';
import { OnboardingChecklist } from './OnboardingChecklist';
import { updateOnboardingStep } from '@/app/actions/onboarding';

interface OnboardingChecklistClientProps {
  initialSteps: OnboardingStep[];
}

export function OnboardingChecklistClient({
  initialSteps,
}: OnboardingChecklistClientProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>(initialSteps);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStepUpdate = async (
    stepName: string,
    status: OnboardingStatus,
    data?: Record<string, unknown>
  ) => {
    // Capture previous state for rollback on error
    const previousSteps = steps;

    try {
      const result = await updateOnboardingStep(stepName, status, data);

      if (result.success) {
        // Update local state with the returned step
        setSteps((prev) => {
          const index = prev.findIndex((s) => s.stepName === stepName);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = result.step;
            return updated;
          }
          return [...prev, result.step];
        });

        // Show success notification with step name
        const stepDisplayName = {
          branding: 'Branding',
          dms: 'DMS Connection',
          staff: 'Staff Setup',
          billing: 'Billing',
        }[stepName];

        showNotification(`${stepDisplayName} saved`, 'success');
      }
    } catch (error) {
      // Rollback to previous state on error
      setSteps(previousSteps);
      console.error('Failed to update step:', error);
      showNotification('Failed to save step. Please try again.', 'error');
    }
  };

  return (
    <>
      {notification && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white z-50 ${
            notification.type === 'success'
              ? 'bg-financial-positive'
              : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      )}
      <OnboardingChecklist steps={steps} onStepUpdate={handleStepUpdate} />
    </>
  );
}
