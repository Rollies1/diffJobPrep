import React from 'react'
import { router } from 'expo-router'
import NotificationsScreen from '../../src/screens/NotificationsScreen'
import type { InAppNotification } from '../../src/services/inAppNotifications'

/** Map notification.targetScreen → Expo Router route under (app). */
const ROUTE_BY_TARGET: Record<string, string> = {
  library: '/(app)/library',
  practice: '/(app)/practice',
  tutor: '/(app)/tutor',
  dashboard: '/(app)/dashboard',
  achievements: '/(app)/achievements',
  leaderboard: '/(app)/leaderboard',
}

export default function Notifications() {
  return (
    <NotificationsScreen
      onTab={(key) => {
        if (key === 'home') router.push('/(app)/dashboard')
        else if (key === 'library') router.push('/(app)/library')
        else if (key === 'practice') router.push('/(app)/practice')
        else if (key === 'tutor') router.push('/(app)/tutor')
        else if (key === 'profile') router.push('/(app)/profile')
      }}
      onOpenNotification={(n: InAppNotification) => {
        const target = n.targetScreen ? ROUTE_BY_TARGET[n.targetScreen] : undefined
        if (target) router.push(target)
      }}
    />
  )
}
