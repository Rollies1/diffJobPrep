import React, { useEffect, useCallback } from 'react'
import { Stack, router } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActivityIndicator, View } from 'react-native'
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { useAuthStore } from '../src/store/useAuthStore'
import { NetworkStatus } from '../src/components/NetworkStatus'
import { SyncProvider } from '../src/components/SyncProvider'
import { usePushNotifications, type NotificationTapData } from '../src/hooks/usePushNotifications'
import { useDeepLinks } from '../src/hooks/useDeepLinks'
import { colors } from '../src/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Auth guard: once hydration is done, redirect to the right group.
  useEffect(() => {
    if (!isHydrated) return
    if (isAuthenticated) {
      router.replace('/(app)/dashboard')
    } else {
      router.replace('/(auth)/login')
    }
  }, [isHydrated, isAuthenticated])

  // Push notification tap → route to the relevant screen.
  const handleNotificationTap = useCallback((data: NotificationTapData) => {
    if (!data.screen) return
    // Map notification screen names to routes.
    const routes: Record<string, string> = {
      dashboard: '/(app)/dashboard',
      library: '/(app)/library',
      practice: '/(app)/practice',
      tutor: '/(app)/tutor',
      achievements: '/(app)/achievements',
      notifications: '/(app)/notifications',
      leaderboard: '/(app)/leaderboard',
      study_plan: '/(app)/study-plan',
      session_results: '/(app)/mock-report',
    }
    const route = routes[data.screen] ?? '/(app)/dashboard'
    // Attach params if provided.
    if (data.params) {
      const query = new URLSearchParams(data.params).toString()
      router.push(`${route}?${query}`)
    } else {
      router.push(route)
    }
  }, [])

  usePushNotifications({ isAuthenticated, onTap: handleNotificationTap })
  useDeepLinks(isAuthenticated)

  if (!isHydrated || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SyncProvider queryClient={queryClient}>
        <NetworkStatus />
        <Stack screenOptions={{ headerShown: false }} />
      </SyncProvider>
    </QueryClientProvider>
  )
}
