'use client';

import { useState } from 'react';

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (!res.ok) {
        // P-7: Surface portal errors to the user
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Failed to open billing portal. Please try again.');
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-2 text-sm text-red-600">{error}</p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading…' : 'Manage Subscription'}
      </button>
    </div>
  );
}
