'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { meetsWCAGAA } from '@/src/lib/contrast';
import { BrandingPreview } from '../BrandingPreview';

interface BrandingStepProps {
  status: string;
  data?: Record<string, unknown>;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
}

export function BrandingStep({
  status,
  data,
  onUpdate,
}: BrandingStepProps) {
  const [logoUrl, setLogoUrl] = useState<string>(String(data?.logoUrl ?? ''));
  const [primaryColour, setPrimaryColour] = useState<string>(String(data?.primaryColour ?? '#2563EB'));
  const [contactPhone, setContactPhone] = useState<string>(String(data?.contactPhone ?? ''));
  const [contactEmail, setContactEmail] = useState<string>(String(data?.contactEmail ?? ''));
  const [websiteUrl, setWebsiteUrl] = useState<string>(String(data?.websiteUrl ?? ''));
  const [isSaving, setIsSaving] = useState(false);
  const [showContrastWarning, setShowContrastWarning] = useState(false);

  // Update preview colour and check contrast with error handling
  useEffect(() => {
    try {
      // Don't show warning for empty colour (user hasn't set it yet)
      if (primaryColour && /^#[0-9A-Fa-f]{6}$/.test(primaryColour)) {
        setShowContrastWarning(!meetsWCAGAA(primaryColour));
      } else {
        setShowContrastWarning(false);
      }
    } catch (error) {
      // Silently handle validation errors, default to safe state
      console.warn('Colour validation error:', error);
      setShowContrastWarning(false);
    }
  }, [primaryColour]);

  const handleSave = useCallback(async (updatedData: Record<string, unknown>) => {
    if (onUpdate && !isSaving) {
      setIsSaving(true);
      try {
        await onUpdate(updatedData);
        toast.success('Branding saved');
      } catch (error) {
        console.error('Failed to save branding:', error);
        toast.error('Failed to save branding');
      } finally {
        setIsSaving(false);
      }
    }
  }, [onUpdate, isSaving]);

  const handleFieldBlur = useCallback(() => {
    // Prevent saving while already saving
    if (isSaving) return;

    handleSave({
      logoUrl: logoUrl && logoUrl.trim() ? logoUrl.trim() : undefined,
      primaryColour: primaryColour && primaryColour.trim() ? primaryColour.trim() : undefined,
      contactPhone: contactPhone && contactPhone.trim() ? contactPhone.trim() : undefined,
      contactEmail: contactEmail && contactEmail.trim() ? contactEmail.trim() : undefined,
      websiteUrl: websiteUrl && websiteUrl.trim() ? websiteUrl.trim() : undefined,
    });
  }, [isSaving, logoUrl, primaryColour, contactPhone, contactEmail, websiteUrl, handleSave]);

  const handleColourChange = (colour: string) => {
    setPrimaryColour(colour);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Configure Your Dealership Branding</h3>

        {/* Logo URL Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Logo URL
          </label>
          <input
            type="text"
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            onBlur={handleFieldBlur}
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Upload your logo to a public URL (e.g., S3, Cloudinary)
          </p>
        </div>

        {/* Primary Colour Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Brand Colour
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="#2563EB"
              value={primaryColour}
              onChange={(e) => handleColourChange(e.target.value)}
              onBlur={handleFieldBlur}
              disabled={isSaving}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500 font-mono text-sm"
            />
            <input
              type="color"
              value={primaryColour}
              onChange={(e) => handleColourChange(e.target.value)}
              onBlur={handleFieldBlur}
              disabled={isSaving}
              className="h-10 w-12 border border-gray-300 rounded-lg disabled:opacity-50 cursor-pointer"
            />
          </div>
          {showContrastWarning && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ This colour doesn't meet WCAG AA contrast standards. We'll use Jupiter Blue
              (#2563EB) in consumer-facing emails and dashboards for readability.
            </p>
          )}
        </div>

        {/* Contact Phone Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Contact Phone
          </label>
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            onBlur={handleFieldBlur}
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {/* Contact Email Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Contact Email
          </label>
          <input
            type="email"
            placeholder="support@dealer.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            onBlur={handleFieldBlur}
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {/* Website URL Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Website URL
          </label>
          <input
            type="url"
            placeholder="https://yourdealership.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            onBlur={handleFieldBlur}
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-3 text-foreground">Live Preview</h4>
        <BrandingPreview
          logoUrl={logoUrl}
          primaryColour={primaryColour}
          showContrastWarning={showContrastWarning}
        />
      </div>

      {/* Status Indicator */}
      {status === 'complete' && (
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
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
          <span>Branding configured</span>
        </div>
      )}
    </div>
  );
}
