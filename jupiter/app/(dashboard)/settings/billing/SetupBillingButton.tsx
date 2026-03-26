'use client';

import { useState } from 'react';

export function SetupBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
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

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        No active subscription. Set up billing to access all features.
      </p>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Setting up billing…' : 'Set up billing'}
      </button>
    </div>
  );
}
