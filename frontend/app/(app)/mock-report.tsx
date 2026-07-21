import React from 'react'
import { router } from 'expo-router'
import MockInterviewResultsScreen from '../../src/screens/MockInterviewResultsScreen'

export default function MockInterviewResults() {
  return (
    <MockInterviewResultsScreen
      onHome={() => router.push('/(app)/dashboard')}
    />
  )
}
