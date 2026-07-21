import { useEffect } from 'react'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { parseDeepLink, requiresAuth } from '../services/deepLinks'

export function useDeepLinks(isAuthenticated: boolean) {
  useEffect(() => {
    // 1. Handle the initial URL (app opened via link).
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url, isAuthenticated)
    })

    // 2. Listen for URLs while the app is running.
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url, isAuthenticated)
    })

    return () => subscription.remove()
  }, [isAuthenticated])
}

function handleDeepLink(url: string, isAuthenticated: boolean) {
  const parsed = parseDeepLink(url)
  if (!parsed) return

  // If the target requires auth and the user isn't authenticated,
  // route to login (the auth gate will redirect to the target after login
  // if we store the intended destination).
  if (requiresAuth(parsed.route) && !isAuthenticated) {
    // Store the intended destination so we can redirect after login.
    // For now, just go to login.
    router.replace('/(auth)/login')
    return
  }

  // Navigate to the route with params.
  if (Object.keys(parsed.params).length > 0) {
    const query = new URLSearchParams(parsed.params).toString()
    router.push(`${parsed.route}?${query}`)
  } else {
    router.push(parsed.route)
  }
}

/** Share helper — builds a deep link for sharing content. */
export function useShareLink() {
  return (screen: string, params?: Record<string, string>) => {
    const { buildDeepLink } = require('../services/deepLinks')
    return buildDeepLink(screen, params)
  }
}
