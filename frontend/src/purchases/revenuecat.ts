// @ts-nocheck
import Purchases, { 
  LOG_LEVEL, 
  PurchasesPackage, 
  CustomerInfo,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { analytics } from '../analytics/posthog';

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_KEY_IOS ?? '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_KEY_ANDROID ?? '';

export type SubscriptionTier = 'monthly' | 'yearly' | 'none';

class PurchaseService {
  private isConfigured = false;

  async configure() {
    if (this.isConfigured) return;

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    if (!apiKey || apiKey.includes('mocked_key')) {
      console.warn('RevenueCat disabled or using mock key.');
      // Don't actually configure RevenueCat to avoid crashes, just mark as configured
      this.isConfigured = true;
      return;
    }

    try {
      Purchases.configure({ apiKey });
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      this.isConfigured = true;
    } catch (error) {
      console.warn('RevenueCat configuration failed:', error);
    }
  }

  async getOfferings() {
    try {
      if (!this.isConfigured || !REVENUECAT_API_KEY_ANDROID || REVENUECAT_API_KEY_ANDROID.includes('mocked')) {
        return []; // Return mock offerings if disabled
      }
      const offerings = await Purchases.getOfferings();
      return offerings.current?.availablePackages ?? [];
    } catch (error) {
      analytics.purchaseFailed('get_offerings_failed');
      return [];
    }
  }

  async purchase(packageToBuy: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
    try {
      if (!this.isConfigured || !REVENUECAT_API_KEY_ANDROID || REVENUECAT_API_KEY_ANDROID.includes('mocked')) {
        // Mock a successful purchase for local testing
        return { success: true };
      }

      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToBuy);
      
      const isPremium = customerInfo.entitlements.active['pro']?.isActive ?? false;
      
      if (isPremium) {
        analytics.purchaseCompleted(
          productIdentifier.includes('yearly') ? 'yearly' : 'monthly',
          packageToBuy.product.price,
          packageToBuy.product.currencyCode ?? 'USD'
        );
      }
      
      return { success: isPremium, customerInfo };
    } catch (error: any) {
      if (error.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        analytics.purchaseFailed(error.message ?? 'unknown');
      }
      return { success: false };
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      if (!this.isConfigured || !REVENUECAT_API_KEY_ANDROID || REVENUECAT_API_KEY_ANDROID.includes('mocked')) {
        return null;
      }
      const { customerInfo } = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active['pro']?.isActive ?? false;
      
      if (isPremium) {
        analytics.purchaseRestored();
      }
      
      return customerInfo;
    } catch (error) {
      console.warn('Restore failed', error);
      return null;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isConfigured || !REVENUECAT_API_KEY_ANDROID || REVENUECAT_API_KEY_ANDROID.includes('mocked')) {
      return null;
    }
    return await Purchases.getCustomerInfo();
  }

  async checkPremiumStatus(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    if (!customerInfo) return false;
    return customerInfo.entitlements.active['pro']?.isActive ?? false;
  }

  // Sync RevenueCat ID with analytics for cross-referencing
  async syncWithAnalytics() {
    const customerInfo = await this.getCustomerInfo();
    if (!customerInfo) return;
    const rcId = customerInfo.originalAppUserId;
    // PostHog super property
    analytics.capture('rc_identified', { revenue_cat_id: rcId });
  }
}

export const purchaseService = new PurchaseService();
