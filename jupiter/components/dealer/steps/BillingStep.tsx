'use client';

import React from 'react';
import type { OnboardingStatus } from '@prisma/client';

interface BillingStepProps {
  status: OnboardingStatus;
  data?: Record<string, unknown>;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
}

export function BillingStep({
  status,
  data,
  onUpdate,
}: BillingStepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-900">
          💳 Stripe billing integration coming in Story 2.6 — Stripe Billing Setup.
          <br />
          <br />
          Once configured, your dealership will have an active subscription plan
          and access to all campaign features.
        </p>
      </div>

      <div className="text-sm text-gray-600 space-y-2">
        <p>
          <strong>Current Plan:</strong>{' '}
          {(data?.planName as string) || 'Not configured'}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          {(data?.status as string) || 'Pending setup'}
        </p>
      </div>
    </div>
  );
}
