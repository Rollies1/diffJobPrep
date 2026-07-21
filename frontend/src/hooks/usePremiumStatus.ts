import { useState, useCallback, useEffect } from 'react';
import { purchaseService, SubscriptionTier } from '../purchases/revenuecat';
import { analytics } from '../analytics/posthog';

interface PremiumState {
  isPremium: boolean;
  hasUsedFreePreview: Record<string, boolean>;
  subscriptionTier: SubscriptionTier;
  isLoading: boolean;
}

export function usePremiumStatus() {
  const [state, setState] = useState<PremiumState>({
    isPremium: false,
    hasUsedFreePreview: {},
    subscriptionTier: 'none',
    isLoading: true,
  });

  useEffect(() => {
    // Check RevenueCat status on mount
    purchaseService.checkPremiumStatus().then(isPremium => {
      setState(prev => ({
        ...prev,
        isPremium,
        subscriptionTier: isPremium ? 'monthly' : 'none', // Simplified — parse from RC in production
        isLoading: false,
      }));
    });
  }, []);

  const markPreviewUsed = useCallback((deckId: string) => {
    setState(prev => ({
      ...prev,
      hasUsedFreePreview: { ...prev.hasUsedFreePreview, [deckId]: true },
    }));
    analytics.previewStarted(deckId);
  }, []);

  const canAccessDeck = useCallback((deckId: string, isPremiumDeck: boolean) => {
    if (!isPremiumDeck) return true;
    if (state.isPremium) return true;
    // Allow free preview once per premium deck
    return !state.hasUsedFreePreview[deckId];
  }, [state]);

  const subscribe = useCallback(async (tier: 'monthly' | 'yearly' = 'monthly') => {
    try {
      const packages = await purchaseService.getOfferings();
      const targetPackage = packages.find(p => 
        p.identifier.includes(tier)
      );
      
      if (!targetPackage) {
        // Fallback for dev / mock mode
        const result = await purchaseService.purchase({} as any);
        if (result.success) {
          setState(prev => ({ ...prev, isPremium: true, subscriptionTier: tier }));
          analytics.trialStarted(tier);
          return true;
        }
        analytics.purchaseFailed('package_not_found');
        return false;
      }
      
      const result = await purchaseService.purchase(targetPackage);
      
      if (result.success) {
        setState(prev => ({ ...prev, isPremium: true, subscriptionTier: tier }));
        analytics.trialStarted(tier);
        return true;
      }
      
      return false;
    } catch (error) {
      analytics.purchaseFailed(String(error));
      return false;
    }
  }, []);

  const restore = useCallback(async () => {
    const customerInfo = await purchaseService.restorePurchases();
    const isPremium = customerInfo?.entitlements.active['pro']?.isActive ?? false;
    setState(prev => ({ ...prev, isPremium }));
    return isPremium;
  }, []);

  return {
    ...state,
    markPreviewUsed,
    canAccessDeck,
    subscribe,
    restore,
    // Provide backwards compatibility with Phase 1 hook naming if needed
    unlockPremium: () => subscribe('monthly'),
    previewRemaining: null
  };
}
