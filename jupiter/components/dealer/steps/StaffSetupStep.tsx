'use client';

import React, { useState } from 'react';
import type { OnboardingStatus } from '@prisma/client';

interface StaffSetupStepProps {
  status: OnboardingStatus;
  data?: Record<string, unknown>;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
}

export function StaffSetupStep({
  status,
  data,
  onUpdate,
}: StaffSetupStepProps) {
  const [email, setEmail] = useState<string>((data?.inviteEmail as string) || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleEmailBlur = async () => {
    if (email.trim() && onUpdate) {
      setIsSaving(true);
      try {
        await onUpdate({ inviteEmail: email });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invite Team Members
        </label>
        <input
          type="email"
          placeholder="team@dealership.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          disabled={isSaving}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-900">
          📝 Complete staff management and role assignment coming in:
          <br />
          • Story 2.4 — Dealer Staff Account Management
          <br />
          • Story 2.5 — Role Assignment for Dealer Staff
        </p>
      </div>
    </div>
  );
}
