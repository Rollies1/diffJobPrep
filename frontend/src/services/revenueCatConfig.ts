/**
 * RevenueCat SDK configuration.
 *
 * Per review:
 *   - Platform-specific SDK keys (iOS vs Android have different public keys).
 *   - The entitlement ID must match your RC dashboard.
 *   - Keys are fetched from the backend at runtime (GET /api/revenuecat/config)
 *     so you can rotate them without an app release. For simplicity, you can
 *     also hardcode them here and swap via env vars.
 */

import { Platform } from 'react-native';

// ─── Hardcoded fallback keys (use env vars or backend config in production) ───
export const REVENUECAT_IOS_SDK_KEY =
  process.env.EXPO_PUBLIC_RC_IOS_SDK_KEY ?? 'appl_xxxxxxxxxxxxxxxxxxxxxxxx';

export const REVENUECAT_ANDROID_SDK_KEY =
  process.env.EXPO_PUBLIC_RC_ANDROID_SDK_KEY ?? 'goog_xxxxxxxxxxxxxxxxxxxxxxxx';

export const RC_ENTITLEMENT_ID = 'premium';

/**
 * Returns the correct SDK key for the current platform.
 * Per review: RC gives separate iOS and Android keys.
 */
export function getRevenueCatApiKey(): string {
  return Platform.select({
    ios: REVENUECAT_IOS_SDK_KEY,
    android: REVENUECAT_ANDROID_SDK_KEY,
    default: REVENUECAT_ANDROID_SDK_KEY,
  })!;
}
