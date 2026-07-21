import { useEffect, useRef, useCallback } from 'react'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { notificationsService } from '../services/notifications'
import { useAuthStore } from '../store/useAuthStore'

// Configure how notifications appear while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export type NotificationTapData = {
  screen?: string
  params?: Record<string, string>
  [key: string]: unknown
}

export function usePushNotifications({
  isAuthenticated,
  onTap,
}: {
  isAuthenticated: boolean
  onTap?: (data: NotificationTapData) => void
}) {
  const tokenRef = useRef<string | null>(null)
  const logout = useAuthStore((s) => s.logout)

  /** Request permissions + get Expo push token. */
  const registerForPush = useCallback(async () => {
    if (Platform.OS === 'web') return null

    // 1. Request permission.
    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') {
      console.log('[push] Permission not granted')
      return null
    }

    // 2. Get the Expo push token.
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      if (!projectId) {
        console.log('[push] No EAS project ID found in app.json. Skipping push token registration.')
        return null
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      })
      const token = tokenData.data
      tokenRef.current = token

      // 3. Register with backend.
      await notificationsService.register(token)
      console.log('[push] Registered:', token)
      return token
    } catch (e) {
      console.error('[push] Failed to get token:', e)
      return null
    }
  }, [])

  /** Unregister from backend. */
  const unregister = useCallback(async () => {
    if (tokenRef.current) {
      try {
        await notificationsService.unregister(tokenRef.current)
      } catch {
        // Ignore — best effort.
      }
      tokenRef.current = null
    }
  }, [])

  // Register when authenticated.
  useEffect(() => {
    if (isAuthenticated) {
      registerForPush()
    } else if (tokenRef.current) {
      unregister()
    }
  }, [isAuthenticated, registerForPush, unregister])

  // Listen for notification responses (user tapped a notification).
  useEffect(() => {
    if (!isAuthenticated) return

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as NotificationTapData
      console.log('[push] Tapped:', data)
      onTap?.(data)
    })

    return () => subscription.remove()
  }, [isAuthenticated, onTap])

  // Listen for foreground notifications (optional: show a toast/banner).
  useEffect(() => {
    if (!isAuthenticated) return

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[push] Foreground:', notification.request.content.title)
      // The setNotificationHandler above will show the alert.
      // You could also dispatch to a Zustand store to show an in-app banner.
    })

    return () => subscription.remove()
  }, [isAuthenticated])

  return { registerForPush, unregister }
}
