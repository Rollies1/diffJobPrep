import React, { useEffect, useState } from 'react'
import { Modal, View } from 'react-native'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import OfflineScreen from '../screens/OfflineScreen'

/**
 * Shows the full-screen <OfflineScreen /> ONLY after the device has been
 * offline for a sustained period (default 4s). This gives the lightweight
 * <NetworkStatus /> banner time to appear first as a non-blocking
 * notification — exactly the UX requested:
 *
 *   connection drops  →  banner slides in immediately (non-blocking)
 *   still offline 4s  →  full OfflineScreen modal takes over
 *   connection returns →  modal dismissed, banner slides away
 *
 * A brief connectivity blip therefore only flashes the banner; a real
 * outage surfaces the full screen with retry actions.
 */
export function OfflineDetector({ graceMs = 4000 }: { graceMs?: number }) {
  const { isOnline } = useNetworkStatus()
  const [showFull, setShowFull] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      // Wait out the grace period before committing to the full screen.
      const t = setTimeout(() => setShowFull(true), graceMs)
      return () => clearTimeout(t)
    }
    // Back online — dismiss immediately.
    setShowFull(false)
  }, [isOnline, graceMs])

  const handleRetry = () => {
    // The OfflineScreen retry button — the modal will auto-dismiss when
    // NetInfo flips isOnline back to true (handled by the effect above).
    // Force a re-render cycle by toggling off; the banner stays until then.
    setShowFull(false)
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
