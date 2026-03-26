'use client';

import React, { useState } from 'react';
import type { OnboardingStatus } from '@prisma/client';

interface DMSConnectionStepProps {
  status: OnboardingStatus;
  data?: Record<string, unknown>;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
}

export function DMSConnectionStep({
  status,
  data,
  onUpdate,
}: DMSConnectionStepProps) {
  const [provider, setProvider] = useState<string>((data?.provider as string) || 'dealervault');
  const [isSaving, setIsSaving] = useState(false);

  const handleProviderChange = async (value: string) => {
    setProvider(value);
    if (onUpdate) {
      setIsSaving(true);
      try {
        await onUpdate({ provider: value });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          DMS Provider
        </label>
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          disabled={isSaving}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
        >
          <option value="dealervault">DealerVault</option>
          <option value="simulation">Simulation Mode (Testing)</option>
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-900">
          💡 Full DMS connection setup coming in Story 3.1 — DealerVault Connection Setup.
          For now, you can use Simulation Mode to test the platform.
        </p>
      </div>
    </div>
  );
}
