/**
 * useRevenueCat — central hook for RevenueCat SDK state.
 *
 * Per review, this hook addresses:
 *   1. logIn() throws on re-login → check getAppUserID() first.
 *   2. CustomerInfo listener → real-time UI updates when a purchase
 *      completes on another device or the subscription expires.
 *   3. Cached entitlement state → PreviewGate doesn't flash on every render.
 *   4. Proper cleanup on unmount.
 *
 * Usage:
 *   const { isPremium, customerInfo, offerings, isLoading } = useRevenueCat(userId);
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import {
  getRevenueCatApiKey,
  RC_ENTITLEMENT_ID,
} from '../services/revenueCatConfig';

interface RevenueCatState {
  isReady: boolean;
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[] | null;
  currentOffering: PurchasesOffering | null;
}

export function useRevenueCat(userId: string | null) {
  const [state, setState] = useState<RevenueCatState>({
    isReady: false,
    isPremium: false,
    customerInfo: null,
    offerings: null,
    currentOffering: null,
  });

  // Track whether we've called configure() — it must be called exactly once.
  const configuredRef = useRef(false);
  // Track the currently logged-in RC appUserID — avoids redundant logIn calls.
  const loggedInUserRef = useRef<string | null>(null);

  // ─── Configure SDK on mount (once) ───
  useEffect(() => {
    if (configuredRef.current) return;
    configuredRef.current = true;

    const apiKey = getRevenueCatApiKey();
    if (!apiKey || apiKey.includes('xxxxxxxx')) {
      console.log('[RC] Skipping RevenueCat initialization (mock key detected)');
      setState(prev => ({ ...prev, isReady: true }));
      return;
    }

    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({
      apiKey,
      observerMode: false,
    });

    // ─── Register CustomerInfo listener (per review) ───
    // This fires when the subscription changes (purchase, renewal, expiry)
    // even if the change happened on another device.
    const listener = (info: CustomerInfo) => {
      const isPremium = checkEntitlement(info);
      setState(prev => ({ ...prev, customerInfo: info, isPremium }));
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  // ─── Log in the user when userId changes ───
  useEffect(() => {
    if (!userId || !configuredRef.current) return;

    // Per review: don't call logIn() if already logged in as this user.
    // logIn() throws UserAlreadyExistsError if the appUserID matches.
    if (loggedInUserRef.current === userId) return;

    (async () => {
      try {
        const currentAppUserId = await Purchases.getAppUserID();

        // If RC already has this user, skip logIn.
        if (currentAppUserId === userId) {
          loggedInUserRef.current = userId;
          await refreshState();
          return;
        }

        // If RC has an anonymous user, logIn switches to the named user.
        // If RC has a DIFFERENT named user, logIn throws — handle by
        // logging out first (or showing an error in production).
        try {
          const info = await Purchases.logIn(userId);
          loggedInUserRef.current = userId;
          const isPremium = checkEntitlement(info.customerInfo);
          setState(prev => ({
            ...prev,
            customerInfo: info.customerInfo,
            isPremium,
            isReady: true,
          }));
        } catch (e) {
          const err = e as PurchasesError;
          if (err.code === PURCHASES_ERROR_CODE.USER_ALREADY_EXISTS) {
            // Already logged in — just refresh state.
            loggedInUserRef.current = userId;
            await refreshState();
          } else {
            console.error('[RC] logIn failed:', err.message);
          }
        }
      } catch (e) {
        console.error('[RC] getAppUserID failed:', e);
      }
    })();
  }, [userId]);

  // ─── Fetch offerings + customer info ───
  const refreshState = useCallback(async () => {
    try {
      const [offerings, info] = await Promise.all([
        Purchases.getOfferings(),
        Purchases.getCustomerInfo(),
      ]);

      const isPremium = checkEntitlement(info);
      const current = offerings.current;

      setState({
        isReady: true,
        isPremium,
        customerInfo: info,
        offerings: offerings.all ? Array.from(offerings.all) as PurchasesOffering[] : [],
        currentOffering: current,
      });
    } catch (e) {
      console.error('[RC] refreshState failed:', e);
      setState(prev => ({ ...prev, isReady: true }));
    }
  }, []);

  // ─── Purchase a package ───
  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<{ success: boolean; cancelled: boolean; error?: string }> => {
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const isPremium = checkEntitlement(customerInfo);
        setState(prev => ({ ...prev, customerInfo, isPremium }));
        return { success: isPremium, cancelled: false };
      } catch (e) {
        const err = e as PurchasesError;

        // Per review: handle UserCancelledError gracefully — don't show
        // "Purchase failed" when the user simply dismissed the sheet.
        if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return { success: false, cancelled: true };
        }

        if (err.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
          return { success: false, cancelled: false, error: 'Payment is pending.' };
        }

        if (err.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
          return { success: false, cancelled: false, error: 'Purchases are not allowed on this device.' };
        }

        console.error('[RC] purchase failed:', err.message);
        return { success: false, cancelled: false, error: err.message };
      }
    },
    [],
  );

  // ─── Restore purchases (required by Apple Guideline 3.1.1) ───
  const restorePurchases = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const info = await Purchases.restorePurchases();
      const isPremium = checkEntitlement(info);
      setState(prev => ({ ...prev, customerInfo: info, isPremium }));
      return { success: isPremium };
    } catch (e) {
      const err = e as PurchasesError;
      console.error('[RC] restore failed:', err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // ─── Log out (switch back to anonymous RC user) ───
  const logOut = useCallback(async () => {
    try {
      await Purchases.logOut();
      loggedInUserRef.current = null;
      await refreshState();
    } catch (e) {
      console.error('[RC] logOut failed:', e);
    }
  }, [refreshState]);

  return {
    ...state,
    purchasePackage,
    restorePurchases,
    logOut,
    refresh: refreshState,
  };
}

/**
 * Check if the customer info has the premium entitlement.
 */
function checkEntitlement(info: CustomerInfo | null): boolean {
  if (!info || !info.entitlements) return false;
  const entitlement = info.entitlements.active[RC_ENTITLEMENT_ID];
  return !!entitlement;
}
