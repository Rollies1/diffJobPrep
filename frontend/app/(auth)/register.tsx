import React from 'react'
import { router } from 'expo-router'
import RegisterScreen from '../../src/screens/RegisterScreen'

export default function Register() {
  return <RegisterScreen onRegisterSuccess={() => router.replace('/(app)/onboarding')} />
}
