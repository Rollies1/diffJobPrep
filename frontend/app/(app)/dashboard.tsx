import React from 'react'
import { router } from 'expo-router'
import DashboardScreen from '../../src/screens/DashboardScreen'

export default function Dashboard() {
  const onTab = (key: string) => {
    if (key === 'home') return
    if (key === 'library') router.push('/(app)/library')
    else if (key === 'practice') router.push('/(app)/practice')
    else if (key === 'tutor') router.push('/(app)/tutor')
    else if (key === 'profile') router.push('/(app)/profile')
  }
  return <DashboardScreen onTab={onTab} />
}
