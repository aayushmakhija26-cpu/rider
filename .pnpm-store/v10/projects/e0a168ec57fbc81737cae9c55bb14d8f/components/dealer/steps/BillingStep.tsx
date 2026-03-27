'use client';

import React, { useState, useEffect } from 'react';
import type { OnboardingStatus } from '@prisma/client';
import { startCheckout, openCustomerPortal, syncSubscriptionData } from '@/app/actions/billing';

interface BillingStepProps {
  status: OnboardingStatus;
  data?: Record<string, unknown>;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
  dealerData?: {
    dealerId: string;
    stripeSubscriptionId: string | null;
    planName: string | null;
  };
}

export function BillingStep({
  status,
  data,
  onUpdate,
  dealerData,
}: BillingStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(dealerData);

  // Check if we just returned from Stripe checkout and sync data
  useEffect(() => {
    const checkAndSync = async () => {
      if (!dealerData?.dealerId) {
        console.log('[BillingStep] No dealerId provided');
        return;
      }

      // If already configured, no need to sync
      if (dealerData.stripeSubscriptionId) {
        console.log('[BillingStep] Already has subscription:', dealerData.stripeSubscriptionId);
        setSubscriptionData(dealerData);

        // Mark step as complete if not already marked
        if (status !== 'complete' && onUpdate) {
          console.log('[BillingStep] Marking billing step as complete');
          try {
            await onUpdate({
              stripeSubscriptionId: dealerData.stripeSubscriptionId,
              planName: dealerData.planName,
            });
          } catch (error) {
            console.error('[BillingStep] Failed to mark step complete:', error);
          }
        }
        return;
      }

      // Try to sync from Stripe
      console.log('[BillingStep] Syncing subscription data from Stripe...');
      try {
        const result = await syncSubscriptionData(dealerData.dealerId);
        console.log('[BillingStep] Sync result:', result);
        if (result) {
          const newData = {
            dealerId: dealerData.dealerId,
            stripeSubscriptionId: result.stripeSubscriptionId,
            planName: result.planName,
          };
          setSubscriptionData(newData);

          // Mark step as complete
          if (onUpdate) {
            console.log('[BillingStep] Marking billing step as complete after sync');
            try {
              await onUpdate({
                stripeSubscriptionId: result.stripeSubscriptionId,
                planName: result.planName,
              });
            } catch (error) {
              console.error('[BillingStep] Failed to mark step complete:', error);
            }
          }
        }
      } catch (error) {
        console.error('[BillingStep] Failed to sync subscription:', error);
      }
    };

    checkAndSync();
  }, [dealerData?.dealerId, dealerData?.stripeSubscriptionId, status, onUpdate]);

  const isConfigured = subscriptionData?.stripeSubscriptionId;
  const planName = subscriptionData?.planName || 'Not configured';

  const handleSetupBilling = async () => {
    setIsLoading(true);
    try {
      await startCheckout();
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isConfigured ? (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
            <p className="text-sm text-emerald-900">
              ✓ Your subscription is active. You have full access to all campaign features.
            </p>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Current Plan:</strong> {planName}
            </p>
            <p>
              <strong>Status:</strong> Active
            </p>
          </div>

          <button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Loading...' : 'Manage Subscription'}
          </button>
        </>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-900">
              💳 Set up a subscription to activate your dealership account and access all campaign features.
            </p>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Current Plan:</strong> Not configured
            </p>
            <p>
              <strong>Status:</strong> Pending setup
            </p>
          </div>

          <button
            onClick={handleSetupBilling}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Loading...' : 'Set up billing'}
          </button>
        </>
      )}
    </div>
  );
}
