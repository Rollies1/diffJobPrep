import React from 'react'
import { router } from 'expo-router'
import LoginScreen from '../../src/screens/LoginScreen'

export default function Login() {
  return (
    <LoginScreen 
      onLoginSuccess={() => router.replace('/(app)/dashboard')} 
      onRegister={() => router.push('/(auth)/register')}
    />
  )
}
