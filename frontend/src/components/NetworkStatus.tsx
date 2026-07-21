import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, SafeAreaView, Pressable } from 'react-native'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { Feather } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

/**
 * A lightweight offline notification banner that slides down from the top
 * the instant the device loses connectivity.
 *
 * It is intentionally NON-blocking (pointerEvents="none") so the user can
 * keep interacting with the current screen — this is the "notification"
 * that appears BEFORE the full-screen OfflineScreen takes over (see
 * <OfflineDetector />). On reconnect it slides back up with a success haptic.
 */
export const NetworkStatus: React.FC = () => {
  const { isOnline } = useNetworkStatus()
  const translateY = useRef(new Animated.Value(-100)).current
  // Track whether we've ever been online so we don't flash the banner on
  // cold-start while NetInfo is still resolving.
  const [wasOnline, setWasOnline] = useState(true)

  useEffect(() => {
    if (!isOnline) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setWasOnline(false)
    } else if (!wasOnline) {
      // Only buzz + slide away if we're recovering from offline.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setWasOnline(true)
    }

    Animated.spring(translateY, {
      toValue: isOnline ? -100 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start()
  }, [isOnline, wasOnline, translateY])

  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      className="absolute top-0 left-0 right-0 z-[100] bg-rose-600 shadow-lg"
      pointerEvents="none"
    >
      <SafeAreaView>
        <View className="px-4 py-3 flex-row items-center justify-center pt-12">
          <Feather name="wifi-off" size={16} color="white" className="mr-2" />
          <Text className="text-white text-sm font-extrabold uppercase tracking-widest">
            No Internet Connection
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  )
}
