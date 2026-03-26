'use client';

import { FALLBACK_COLOUR } from '@/src/lib/contrast';

interface BrandingPreviewProps {
  logoUrl?: string;
  primaryColour: string;
  showContrastWarning: boolean;
}

export function BrandingPreview({
  logoUrl,
  primaryColour,
  showContrastWarning,
}: BrandingPreviewProps) {
  // Use fallback colour for display if contrast warning is shown
  const displayColour = showContrastWarning ? FALLBACK_COLOUR : primaryColour;

  return (
    <div className="space-y-4">
      {/* Email Header Preview */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div
          style={{ backgroundColor: displayColour }}
          className="h-20 flex items-center justify-center"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-16 w-auto max-w-xs"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-white text-sm font-semibold">Logo preview</div>
          )}
        </div>
        <div className="p-4 bg-slate-50">
          <p className="text-xs text-muted-foreground">Email header preview</p>
          <p className="text-xs text-gray-500 mt-2">
            This is how your branding will appear in consumer emails.
          </p>
        </div>
      </div>

      {/* Dashboard Hero Preview */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div
          style={{ backgroundColor: displayColour }}
          className="h-32 flex items-end p-4"
        >
          <div className="text-white">
            <div className="text-sm font-semibold">Your Vehicle Dashboard</div>
            <div className="text-xs opacity-90">Powered by Jupiter</div>
          </div>
        </div>
      </div>

      {/* Contrast Warning */}
      {showContrastWarning && (
        <div className="text-xs text-amber-700 p-3 bg-amber-50 rounded border border-amber-200">
          <p className="font-semibold mb-1">⚠️ Contrast Warning</p>
          <p>
            This colour doesn't meet WCAG AA accessibility standards (4.5:1 contrast ratio
            against white). We'll automatically use Jupiter Blue (#2563EB) in all
            consumer-facing emails and dashboards to ensure readability.
          </p>
        </div>
      )}
    </div>
  );
}
