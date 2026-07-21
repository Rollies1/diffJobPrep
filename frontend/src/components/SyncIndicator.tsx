import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { RefreshCw, CloudOff, CheckCircle2 } from 'lucide-react-native'
import { useSyncStore } from '../store/useSyncStore'
import { useNetInfo } from '@react-native-community/netinfo'
import { colors, shadows } from '../theme'

export function SyncIndicator() {
  const { isSyncing, pendingCount, lastSyncedAt } = useSyncStore()
  const netInfo = useNetInfo()
  const isOffline = !netInfo.isConnected

  // Don't show if nothing pending and not syncing.
  if (pendingCount === 0 && !isSyncing) return null

  return (
    <View style={styles.container}>
      {isSyncing ? (
        <View style={styles.syncingPill}>
          <RefreshCw size={14} color="#fff" style={{ transform: [{ rotate: '0deg' }] }} />
          <Text style={styles.text}>Syncing {pendingCount} items…</Text>
        </View>
      ) : isOffline && pendingCount > 0 ? (
        <View style={styles.offlinePill}>
          <CloudOff size={14} color="#fff" />
          <Text style={styles.text}>{pendingCount} pending · will sync when online</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  syncingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
    ...shadows.soft,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#9aa1ab',
    ...shadows.card,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
})
