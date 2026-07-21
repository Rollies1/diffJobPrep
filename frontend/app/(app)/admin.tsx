import React from 'react'
import { router } from 'expo-router'
import AdminMetricsScreen from '../../src/screens/AdminMetricsScreen'

export default function AdminMetrics() {
  return (
    <AdminMetricsScreen
      onBack={() => router.back()}
    />
  )
}
