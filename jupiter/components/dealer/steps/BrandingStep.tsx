'use client';

import React, { useState } from 'react';
import type { OnboardingStatus } from '@prisma/client';

interface BrandingStepProps {
  status: OnboardingStatus;
  data?: Record<string, unknown>;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
}

export function BrandingStep({
  status,
  data,
  onUpdate,
}: BrandingStepProps) {
  const [logoUrl, setLogoUrl] = useState<string>((data?.logoUrl as string) || '');
  const [primaryColor, setPrimaryColor] = useState<string>((data?.primaryColor as string) || '#2563EB');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (updatedData: Record<string, unknown>) => {
    if (onUpdate) {
      setIsSaving(true);
      try {
        await onUpdate(updatedData);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleLogoBlur = () => {
    handleSave({ logoUrl, primaryColor });
  };

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    handleSave({ logoUrl, primaryColor: color });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo URL
        </label>
        <input
          type="text"
          placeholder="https://example.com/logo.png"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          onBlur={handleLogoBlur}
          disabled={isSaving}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Color
        </label>
        <input
          type="color"
          value={primaryColor}
          onChange={(e) => handleColorChange(e.target.value)}
          disabled={isSaving}
          className="w-16 h-10 border border-gray-300 rounded-lg disabled:opacity-50"
        />
      </div>

      <p className="text-sm text-gray-600">
        More configuration options coming in Story 2.3 — Dealership Branding Configuration.
      </p>
    </div>
  );
}
