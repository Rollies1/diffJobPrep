// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Modal, View } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import OfflineScreen from '../screens/OfflineScreen'

/**
 * Shows the full-screen <OfflineScreen /> ONLY after the device has been
 * offline for a sustained period (default 8s). This gives the lightweight
 * <NetworkStatus /> banner a meaningful window to appear first as a
 * non-blocking notification — exactly the UX requested:
 *
 *   connection drops   →  banner slides in immediately (non-blocking) and
 *                         STAYS visible for the entire grace window.
 *   still offline 8s   →  full OfflineScreen modal takes over.
 *   connection returns →  modal dismissed, banner slides away.
 *
 * A brief connectivity blip (< 8s) therefore only flashes the banner; a
 * real outage surfaces the full screen with retry actions.
 *
 * The 8s grace is intentional: it lets the user keep using cached UI for
 * short drops (subway, elevator) without being kicked into a full-screen
 * wall, while still surfacing real outages promptly. The banner does NOT
 * auto-dismiss during the grace window (see NetworkStatus.tsx).
 */
export function OfflineDetector({ graceMs = 8000 }: { graceMs?: number }) {
  const { isOnline } = useNetworkStatus()
  const [showFull, setShowFull] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      // Wait out the grace period before committing to the full screen.
      // During this window the <NetworkStatus /> banner is the only UI
      // shown — it does NOT auto-dismiss.
      const t = setTimeout(() => setShowFull(true), graceMs)
      return () => clearTimeout(t)
    }
    // Back online — dismiss immediately (the banner slides away on its own).
    setShowFull(false)
  }, [isOnline, graceMs])

  /**
   * Manual retry from the full-screen <OfflineScreen />.
   *
   * Instead of just hiding the screen (which would pop it back after the
   * grace window if still offline), we force-fetch connectivity via
   * NetInfo so the user gets immediate, honest feedback.
   *
   * Returns `true` if we're back online (the modal dismisses), or `false`
   * if still offline (OfflineScreen shows a brief "Still offline —
   * retrying…" state on the button and resets its auto-retry countdown).
   */
  const handleRetry = async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch()
      const online = state.isInternetReachable ?? state.isConnected ?? false
      if (online) {
        setShowFull(false)
        return true
      }
    } catch {
      // NetInfo.fetch throwing is effectively "still offline".
    }
    return false
  }

  return (
    <Modal
      visible={showFull}
      animationType="fade"
      transparent={false}
      onRequestClose={handleRetry}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <OfflineScreen onRetry={handleRetry} />
      </View>
    </Modal>
  )
}
