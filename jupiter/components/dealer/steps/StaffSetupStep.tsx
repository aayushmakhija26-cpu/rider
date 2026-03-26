'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { DealerStaffSummary } from '@/src/services/dealerStaff.service';

interface StaffSetupStepProps {
  dealerId: string;
  status: 'pending' | 'active' | 'complete' | 'skipped';
  data?: Record<string, unknown>;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
}

type StaffStatus = 'pending' | 'active' | 'deactivated';

const STATUS_BADGE: Record<StaffStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  deactivated: { label: 'Deactivated', className: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

// Simple email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function StaffSetupStep({ dealerId, status, onUpdate }: StaffSetupStepProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const [staff, setStaff] = useState<DealerStaffSummary[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [changingRoles, setChangingRoles] = useState<Set<string>>(new Set());

  const loadStaff = useCallback(async (signal?: AbortSignal) => {
    if (!dealerId) return;
    setIsLoadingStaff(true);
    setStaffError(null);
    try {
      const res = await fetch(`/api/dealers/${dealerId}/staff`, { signal });
      if (!res.ok) throw new Error('Failed to load staff');
      const data = await res.json();
      setStaff(data.staff ?? []);
    } catch (error) {
      // Ignore abort errors (component unmounted or dealerId changed)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setStaffError('Could not load staff list. Please refresh the page.');
    } finally {
      setIsLoadingStaff(false);
    }
  }, [dealerId]);

  useEffect(() => {
    const controller = new AbortController();
    loadStaff(controller.signal);
    return () => controller.abort();
  }, [loadStaff]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    // Validate email format before API call
    if (!isValidEmail(trimmedEmail)) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    setIsSending(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch(`/api/dealers/${dealerId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error ?? 'Failed to send invite. Please try again.');
        return;
      }

      const isResend = data.inviteMode === 'resent';
      // Use simple escaped message to prevent XSS; React automatically escapes state values in text content
      setInviteSuccess(
        isResend
          ? `Invite resent to ${trimmedEmail}.`
          : `Invite sent to ${trimmedEmail}.`
      );
      setEmail('');
      await loadStaff();

      // Mark step complete after first successful invite
      if (!isResend && onUpdate) {
        await onUpdate({ firstInviteSentAt: new Date().toISOString() });
      }
    } catch {
      setInviteError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeactivate = async (staffUserId: string) => {
    setIsDeactivating(true);
    try {
      const res = await fetch(
        `/api/dealers/${dealerId}/staff/${staffUserId}/deactivate`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const data = await res.json();
        setStaffError(data.error ?? 'Failed to deactivate staff account.');
        return;
      }

      setConfirmDeactivate(null);
      await loadStaff();
    } catch {
      setStaffError('An unexpected error occurred.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleChangeRole = async (staffUserId: string, newRole: 'DEALER_STAFF' | 'DEALER_ADMIN') => {
    setChangingRoles((prev) => new Set(prev).add(staffUserId));
    try {
      const res = await fetch(
        `/api/dealers/${dealerId}/staff/${staffUserId}/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newRole }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = data.code as string | undefined;
        const message =
          code === 'FORBIDDEN' ? 'You do not have permission to change this role.' :
          code === 'NOT_FOUND' ? 'Staff member not found.' :
          'Failed to update role. Please try again.';
        toast.error(message);
        return;
      }

      toast.success('Staff role updated.');
      await loadStaff().catch(() => {
        // Role was updated; list reload failed — surface a soft warning
        toast.error('Role updated, but the staff list could not be refreshed. Please reload.');
      });
    } catch {
      toast.error('An unexpected error occurred while updating role.');
    } finally {
      setChangingRoles((prev) => {
        const next = new Set(prev);
        next.delete(staffUserId);
        return next;
      });
    }
  };

  const activeAndPendingCount = staff.filter((s) => s.status !== 'deactivated').length;

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div>
        <label htmlFor="staff-email" className="block text-sm font-medium text-gray-700 mb-1">
          Staff email address
        </label>
        <form onSubmit={handleSendInvite} className="flex gap-2">
          <input
            id="staff-email"
            type="email"
            placeholder="staff@dealership.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setInviteError(null);
              setInviteSuccess(null);
            }}
            disabled={isSending}
            required
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isSending || !email.trim()}
            className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isSending ? 'Sending…' : 'Send Invite'}
          </button>
        </form>

        {inviteError && (
          <p className="mt-2 text-sm text-red-600">{inviteError}</p>
        )}
        {inviteSuccess && (
          <p className="mt-2 text-sm text-emerald-600">{inviteSuccess}</p>
        )}
      </div>

      {/* Staff list */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Staff accounts
          {activeAndPendingCount > 0 && (
            <span className="ml-2 text-xs text-gray-500">({activeAndPendingCount} active or pending)</span>
          )}
        </h4>

        {isLoadingStaff && (
          <p className="text-sm text-gray-500">Loading…</p>
        )}

        {staffError && !isLoadingStaff && (
          <p className="text-sm text-red-600">{staffError}</p>
        )}

        {!isLoadingStaff && !staffError && staff.length === 0 && (
          <p className="text-sm text-gray-500 italic">No staff accounts yet. Send an invite above to get started.</p>
        )}

        {!isLoadingStaff && staff.length > 0 && (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {staff.map((member) => {
              const badge = STATUS_BADGE[member.status];
              const isConfirming = confirmDeactivate === member.id;

              return (
                <li key={member.id} className="flex items-center justify-between px-4 py-3 bg-white">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.name ?? member.email}
                    </p>
                    {member.name && (
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                    {member.status === 'deactivated' || member.role === 'DEALER_ADMIN' ? (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {member.role}
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as 'DEALER_STAFF' | 'DEALER_ADMIN')}
                        disabled={changingRoles.has(member.id)}
                        className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="DEALER_STAFF">DEALER_STAFF</option>
                        <option value="DEALER_ADMIN">DEALER_ADMIN</option>
                      </select>
                    )}

                    {member.status !== 'deactivated' && (
                      <>
                        {!isConfirming ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDeactivate(member.id)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600">Are you sure?</span>
                            <button
                              type="button"
                              disabled={isDeactivating}
                              onClick={() => handleDeactivate(member.id)}
                              className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                            >
                              {isDeactivating ? 'Deactivating…' : 'Yes, deactivate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeactivate(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {status === 'complete' && (
        <p className="text-sm text-emerald-600 font-medium">
          ✓ Staff setup step complete
        </p>
      )}
    </div>
  );
}
