import React from 'react'
import { router } from 'expo-router'
import DashboardScreen from '../../src/screens/DashboardScreen'

export default function Dashboard() {
  const onTab = (key: string) => {
    if (key === 'home') return
    const map: Record<string, string> = {
      library: '/(app)/library',
      practice: '/(app)/practice',
      tutor: '/(app)/tutor',
      profile: '/(app)/profile',
    }
    if (map[key]) router.push(map[key])
  }

  const onExplore = () => router.push('/(app)/library/explore')
  const onOpenNotifications = () => router.push('/(app)/notifications')

  return <DashboardScreen onTab={onTab} onExplore={onExplore} onOpenNotifications={onOpenNotifications} />
}
