'use client';

import { useState } from 'react';
import type { OnboardingStatus } from '@prisma/client';
import Link from 'next/link';

interface BillingStepProps {
  status: OnboardingStatus;
  data?: Record<string, unknown>;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
}

export function BillingStep({ status, data }: BillingStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = status === 'complete';
  const planName = data?.planName as string | undefined;
  const subscriptionStatus = data?.subscriptionStatus as string | undefined;

  const isActiveSubscription =
    subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  async function handleSetupBilling() {
    setError(null);
    // P-12: Surface missing env var to the user rather than silently failing
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) {
      setError('Billing is not configured. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        // P-7: Surface API errors to the user
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Failed to start billing setup. Please try again.');
        return;
      }

      const { url } = await res.json();
      if (!url) {
        setError('Failed to start billing setup. Please try again.');
        return;
      }
      window.location.href = url;
    } catch {
      setError('Failed to start billing setup. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (isComplete) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {planName ?? 'Active subscription'}
            </p>
            {subscriptionStatus && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActiveSubscription
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {subscriptionStatus}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/settings/billing"
          className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-500"
        >
          Manage Subscription →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Set up your dealership subscription to access all campaign features.
      </p>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="button"
        onClick={handleSetupBilling}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Setting up billing…
          </>
        ) : (
          'Set up billing'
        )}
      </button>
    </div>
  );
}
