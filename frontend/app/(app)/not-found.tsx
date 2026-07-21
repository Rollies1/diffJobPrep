import React from 'react'
import { router } from 'expo-router'
import NotFoundScreen from '../../src/screens/NotFoundScreen'

export default function NotFound() {
  return (
    <NotFoundScreen
      onHome={() => router.push('/(app)/dashboard')}
    />
  )
}
