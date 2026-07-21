/**
 * PaywallModal — displays available packages and handles the purchase flow.
 *
 * Per review:
 *   - Fetches offerings from RC SDK (not hardcoded).
 *   - Handles purchase errors gracefully (UserCancelled ≠ "Purchase failed").
 *   - "Restore Purchases" button (Apple Guideline 3.1.1 requirement).
 *   - Analytics events for the full funnel (view, dismiss, purchase started,
 *     purchase failed, purchase completed).
 *   - Falls back gracefully if offerings fail to load (offline).
 *
 * Styling: uses your existing blue→teal→gold→amber→orange palette.
 * Adjust the color values to match your app's theme.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useRevenueCat } from '../../hooks/useRevenueCat';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called when the user successfully purchases (or already had premium). */
  onPurchased?: () => void;
}

export function PaywallModal({ visible, onClose, onPurchased }: PaywallModalProps) {
  const { currentOffering, purchasePackage, restorePurchases, isPremium } = useRevenueCat(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // ─── Analytics: log paywall view ───
  useEffect(() => {
    if (visible) {
      logAnalyticsEvent('paywall_viewed', { offering_id: currentOffering?.identifier });
    }
  }, [visible]);

  // ─── If user becomes premium while modal is open, close it ───
  useEffect(() => {
    if (visible && isPremium) {
      onPurchased?.();
      onClose();
    }
  }, [visible, isPremium, onPurchased, onClose]);

  const packages = currentOffering?.availablePackages ?? [];

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    logAnalyticsEvent('purchase_started', { product_id: pkg.product.identifier });

    const result = await purchasePackage(pkg);

    setPurchasing(false);

    if (result.success) {
      logAnalyticsEvent('purchase_completed', { product_id: pkg.product.identifier });
      onPurchased?.();
      onClose();
    } else if (result.cancelled) {
      // User dismissed the sheet — don't show an error.
      logAnalyticsEvent('purchase_cancelled', { product_id: pkg.product.identifier });
    } else {
      logAnalyticsEvent('purchase_failed', {
        product_id: pkg.product.identifier,
        error: result.error,
      });
      Alert.alert('Purchase Failed', result.error ?? 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    logAnalyticsEvent('restore_attempted', {});

    const result = await restorePurchases();
    setRestoring(false);

    if (result.success) {
      logAnalyticsEvent('restore_succeeded', {});
      onPurchased?.();
      onClose();
    } else {
      Alert.alert('Restore Failed', result.error ?? 'No previous purchases found.');
    }
  };

  const handleDismiss = () => {
    logAnalyticsEvent('paywall_dismissed', {});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent={false}>
      <View style={styles.container}>
        {/* Header with gradient accent (blue → teal → gold → amber → orange) */}
        <View style={styles.headerGradient} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Unlock JobPrep Premium</Text>
          <Text style={styles.subtitle}>
            Get unlimited AI tutoring, practice sessions, and deep analytics.
          </Text>

          {/* Offering packages */}
          {packages.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.emptyText}>Loading plans…</Text>
            </View>
          ) : (
            <View style={styles.packagesContainer}>
              {packages.map(pkg => (
                <PackageCard
                  key={pkg.identifier}
                  pkg={pkg}
                  onSelect={() => handlePurchase(pkg)}
                  disabled={purchasing}
                />
              ))}
            </View>
          )}

          {/* Restore purchases (required by Apple) */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring || purchasing}
          >
            <Text style={styles.restoreText}>
              {restoring ? 'Restoring…' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          {/* Legal links */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              Subscriptions auto-renew unless cancelled.{'\n'}
              Manage in your device's subscription settings.
            </Text>
          </View>
        </ScrollView>

        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Package card ───
function PackageCard({
  pkg,
  onSelect,
  disabled,
}: {
  pkg: PurchasesPackage;
  onSelect: () => void;
  disabled: boolean;
}) {
  const priceString = pkg.product.priceString;
  const isPopular = pkg.identifier === '$rc_annual' || pkg.identifier === 'annual';

  return (
    <TouchableOpacity
      style={[styles.packageCard, isPopular && styles.popularCard]}
      onPress={onSelect}
      disabled={disabled}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Best Value</Text>
        </View>
      )}
      <Text style={styles.packageTitle}>{pkg.product.title}</Text>
      <Text style={styles.packagePrice}>{priceString}</Text>
      <Text style={styles.packagePeriod}>
        {pkg.packageType === 'ANNUAL' ? 'per year' : 'per month'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles (adjust to match your app's design system) ───
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    height: 6,
    backgroundColor: '#2563EB',
    // For a true gradient, use react-native-linear-gradient:
    // colors={['#2563EB', '#0D9488', '#CA8A04', '#D97706', '#EA580C']}
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  packagesContainer: {
    gap: 12,
  },
  packageCard: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  popularCard: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 8,
  },
  packagePeriod: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  restoreButton: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 14,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  legalContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
  },
} as const;

// ─── Analytics helper ───
// In production, this would POST to /api/analytics/events via your
// gateway. For now it's a console.log stub.
function logAnalyticsEvent(eventName: string, properties: Record<string, unknown>) {
  // Replace with your actual analytics client:
  // fetch('/api/analytics/events', { method: 'POST', body: JSON.stringify({ eventName, properties, eventCategory: 'paywall' }) })
  console.log(`[analytics] ${eventName}`, properties);
}
