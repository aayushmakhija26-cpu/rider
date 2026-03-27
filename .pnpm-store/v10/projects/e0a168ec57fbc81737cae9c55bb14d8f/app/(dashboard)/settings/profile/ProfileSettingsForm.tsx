'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { meetsWCAGAA } from '@/src/lib/contrast';

interface ProfileValues {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColour: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
}

interface ProfileSettingsFormProps {
  dealerId: string;
  initialValues: ProfileValues;
}

export function ProfileSettingsForm({ dealerId, initialValues }: ProfileSettingsFormProps) {
  const [name, setName] = useState(initialValues.name ?? '');
  const [nameError, setNameError] = useState('');
  const [logoUrl, setLogoUrl] = useState(initialValues.logoUrl ?? '');
  const [primaryColour, setPrimaryColour] = useState(initialValues.primaryColour ?? '');
  const [contactPhone, setContactPhone] = useState(initialValues.contactPhone ?? '');
  const [contactEmail, setContactEmail] = useState(initialValues.contactEmail ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(initialValues.websiteUrl ?? '');
  const [showColourWarning, setShowColourWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (primaryColour && /^#[0-9A-Fa-f]{6}$/.test(primaryColour)) {
      setShowColourWarning(!meetsWCAGAA(primaryColour));
    } else {
      setShowColourWarning(false);
    }
  }, [primaryColour]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Dealership name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/dealers/${dealerId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          logoUrl: logoUrl || '',
          primaryColour: primaryColour || '',
          contactPhone: contactPhone || '',
          contactEmail: contactEmail || '',
          websiteUrl: websiteUrl || '',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? 'Failed to save profile. Please try again.');
        return;
      }

      toast.success('Branding saved');
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(primaryColour);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dealership Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your dealership&apos;s profile information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {/* Dealership Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Dealership Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
            />
            {nameError && (
              <p className="text-xs text-red-600 mt-1">{nameError}</p>
            )}
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="logoUrl" className="block text-sm font-medium text-foreground mb-2">
              Logo URL
            </label>
            <input
              id="logoUrl"
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {/* Brand Colour */}
          <div>
            <label htmlFor="primaryColour" className="block text-sm font-medium text-foreground mb-2">
              Brand Colour
            </label>
            <div className="flex gap-2">
              <input
                id="primaryColour"
                type="text"
                placeholder="#2563EB"
                value={primaryColour}
                onChange={(e) => setPrimaryColour(e.target.value)}
                disabled={isSaving}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500 font-mono text-sm"
              />
              <input
                type="color"
                value={isValidHex ? primaryColour : '#2563EB'}
                onChange={(e) => setPrimaryColour(e.target.value)}
                disabled={isSaving}
                className="h-10 w-12 border border-gray-300 rounded-lg disabled:opacity-50 cursor-pointer"
              />
            </div>
            {showColourWarning && (
              <p className="text-xs text-amber-600 mt-2">
                This colour may not meet accessibility standards. It will be saved as Jupiter Blue (#2563EB).
              </p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-foreground mb-2">
              Contact Phone
            </label>
            <input
              id="contactPhone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-2">
              Contact Email
            </label>
            <input
              id="contactEmail"
              type="email"
              placeholder="support@dealer.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {/* Website URL */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-foreground mb-2">
              Website URL
            </label>
            <input
              id="websiteUrl"
              type="url"
              placeholder="https://yourdealership.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
