import React from 'react'
import { router } from 'expo-router'
import SettingsScreen from '../../src/screens/SettingsScreen'

export default function Settings() {
  return <SettingsScreen onBack={() => router.back()} />
}
