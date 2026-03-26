'use client';

import React from 'react';
import type { OnboardingStatus } from '@prisma/client';

interface OnboardingStepCardProps {
  children: React.ReactNode;
  status: OnboardingStatus;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

export function OnboardingStepCard({
  children,
  status,
  onSave,
  isSaving = false,
}: OnboardingStepCardProps) {
  return (
    <div className="space-y-4">
      {children}
      {status !== 'complete' && onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    </div>
  );
}
