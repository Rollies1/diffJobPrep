import React from 'react'
import { router } from 'expo-router'
import TutorScreen from '../../src/screens/TutorScreen'

export default function Tutor() {
  return <TutorScreen onBack={() => router.back()} />
}
