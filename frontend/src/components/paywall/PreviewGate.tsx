/**
 * PreviewGate — wraps premium content and shows the PaywallModal if the
 * user lacks the premium entitlement.
 *
 * Per review:
 *   - Doesn't block rendering while getCustomerInfo() is loading —
 *     shows children optimistically to avoid a flash of nothing.
 *   - Caches the entitlement state in the useRevenueCat hook so the
 *     gate doesn't re-fetch on every render.
 *   - Intercepts the touch event on premium content rather than hiding
 *     it entirely — the user sees what they're missing, which is a
 *     stronger conversion signal than a blank screen.
 *   - Blurs or dims the premium content to indicate it's locked.
 *
 * Usage:
 *   <PreviewGate userId={userId} previewLimit={2}>
 *     <PremiumContent />
 *   </PreviewGate>
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { PaywallModal } from './PaywallModal';

interface PreviewGateProps {
  userId: string | null;
  children: ReactNode;
  /**
   * How many times the user can preview the content before the gate
   * activates. Default: 3.
   */
  previewLimit?: number;
  /**
   * If true, the premium content is rendered behind a blur overlay
   * (rather than being hidden entirely). Default: true.
   */
  showBlurredPreview?: boolean;
  /**
   * Called when the paywall is shown (for analytics).
   */
  onPaywallShown?: () => void;
  /**
   * Called when the user successfully purchases premium.
   */
  onPurchased?: () => void;
  style?: ViewStyle;
}

const PREVIEW_COUNT_KEY = 'preview_gate_count';

export function PreviewGate({
  userId,
  children,
  previewLimit = 3,
  showBlurredPreview = true,
  onPaywallShown,
  onPurchased,
  style,
}: PreviewGateProps) {
  const { isPremium, isReady } = useRevenueCat(userId);
  const [showPaywall, setShowPaywall] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);

  // Load preview count from storage (AsyncStorage in RN).
  // In production, persist this so it survives app restarts.
  useEffect(() => {
    // AsyncStorage.getItem(PREVIEW_COUNT_KEY).then(c => setPreviewCount(Number(c) || 0));
  }, []);

  // ─── If premium or still loading, show content ───
  // Per review: don't block rendering while getCustomerInfo() loads.
  // Show content optimistically; only gate when we KNOW the user lacks access.
  if (isPremium || !isReady) {
    return <View style={style}>{children}</View>;
  }

  // ─── User is not premium. Check preview limit. ───
  const hasPreviewLeft = previewCount < previewLimit;

  const handlePress = () => {
    if (hasPreviewLeft) {
      // Increment preview count.
      const newCount = previewCount + 1;
      setPreviewCount(newCount);
      // AsyncStorage.setItem(PREVIEW_COUNT_KEY, String(newCount));
    } else {
      // No previews left — show paywall.
      setShowPaywall(true);
      onPaywallShown?.();
      logAnalyticsEvent('paywall_triggered', {
        preview_count: previewCount,
        trigger: 'gate_tap',
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.touchable}
        // If previews are left, allow the child to receive touches normally.
        // If not, intercept touches to show the paywall.
        pointerEvents={hasPreviewLeft ? 'box-none' : 'auto'}
      >
        {showBlurredPreview && !hasPreviewLeft ? (
          <View style={styles.blurredContainer}>
            {children}
            <View style={styles.blurOverlay} />
          </View>
        ) : (
          children
        )}
      </TouchableOpacity>

      {/* Lock indicator (only when no previews left) */}
      {!hasPreviewLeft && (
        <View style={styles.lockBadge}>
          <LockIcon />
          <Text style={styles.lockText}>Premium</Text>
        </View>
      )}

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchased={() => {
          onPurchased?.();
          setShowPaywall(false);
        }}
      />
    </View>
  );
}

// ─── Minimal lock icon (replace with your icon library) ───
function LockIcon() {
  return (
    <View style={styles.lockIcon}>
      {/* In production, use: <Icon name="lock" size={14} color="#FFF" /> */}
    </View>
  );
}

// Inline Text component (avoid importing from 'react-native' twice)
import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  touchable: {
    flex: 1,
  },
  blurredContainer: {
    position: 'relative',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    // For a true blur effect, use react-native-blur:
    // <BlurView intensity={50} />
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  lockIcon: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function logAnalyticsEvent(eventName: string, properties: Record<string, unknown>) {
  console.log(`[analytics] ${eventName}`, properties);
}
