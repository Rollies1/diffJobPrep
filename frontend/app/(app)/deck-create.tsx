import React from 'react'
import { router } from 'expo-router'
import DeckCreationScreen from '../../src/screens/DeckCreationScreen'

export default function DeckCreate() {
  return (
    <DeckCreationScreen
      onBack={() => router.back()}
      onPublish={() => router.replace('/(app)/dashboard')}
    />
  )
}
