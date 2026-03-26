'use client';

import { Button } from '@/components/ui/button';

interface OnboardingCompletionBannerProps {
  onProceed?: () => void;
}

export function OnboardingCompletionBanner({
  onProceed,
}: OnboardingCompletionBannerProps) {
  return (
    <div className="rounded-lg border-2 border-financial-positive bg-emerald-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-financial-positive"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-financial-positive">
            🎉 First campaign scheduled
          </h3>
          <p className="mt-2 text-sm text-gray-700">
            Your dealership setup is complete! You're ready to launch your first campaign and start engaging with customers.
          </p>
          <div className="mt-4">
            <Button
              onClick={onProceed}
              className="bg-financial-positive hover:bg-emerald-700 text-white"
            >
              Continue to Campaigns
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
