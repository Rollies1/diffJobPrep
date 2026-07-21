import React from 'react'
import { router } from 'expo-router'
import OnboardingScreen from '../../src/screens/OnboardingScreen'

export default function Onboarding() {
  return <OnboardingScreen onComplete={() => router.replace('/(app)/dashboard')} />
}
