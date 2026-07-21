export const DEEP_LINK_ROUTES: Record<string, { route: string; paramKeys?: string[] }> = {
  // Core screens
  dashboard: { route: '/(app)/dashboard' },
  library: { route: '/(app)/library' },
  practice: { route: '/(app)/practice' },
  tutor: { route: '/(app)/tutor' },
  profile: { route: '/(app)/profile' },
  settings: { route: '/(app)/settings' },
  search: { route: '/(app)/search' },

  // Gamification
  achievements: { route: '/(app)/achievements' },
  notifications: { route: '/(app)/notifications' },
  leaderboard: { route: '/(app)/leaderboard' },
  'study-plan': { route: '/(app)/study-plan' },

  // Library
  deck: { route: '/(app)/deck/[id]', paramKeys: ['id'] },
  question: { route: '/(app)/question/[id]', paramKeys: ['id'] },
  'deck-start': { route: '/(app)/deck-start/[deckId]', paramKeys: ['deckId'] },

  // Results
  'mock-report': { route: '/(app)/mock-report' },

  // Auth
  login: { route: '/(auth)/login' },
  register: { route: '/(auth)/register' },
}

/** Parse a deep link URL into a route + params. */
export function parseDeepLink(url: string): { route: string; params: Record<string, string> } | null {
  try {
    // Handle both jobprep:// and https://jobprep.app/ formats.
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)

    // e.g., jobprep://practice → pathname is "practice"
    // e.g., https://jobprep.app/practice → pathname is "/practice"
    const screen = segments[0] ?? ''
    const config = DEEP_LINK_ROUTES[screen]

    if (!config) {
      // Unknown screen — default to dashboard.
      return { route: '/(app)/dashboard', params: {} }
    }

    const params: Record<string, string> = {}

    // Extract path params (e.g., deck/abc123 → { id: 'abc123' }).
    if (config.paramKeys) {
      config.paramKeys.forEach((key, i) => {
        const value = segments[i + 1]
        if (value) params[key] = value
      })
    }

    // Also extract query params (e.g., practice?deckId=abc123).
    parsed.searchParams.forEach((value, key) => {
      params[key] = value
    })

    return { route: config.route, params }
  } catch {
    return null
  }
}

/** Build a deep link URL from a screen + params (for sharing). */
export function buildDeepLink(screen: string, params?: Record<string, string>): string {
  const base = `jobprep://${screen}`
  if (!params || Object.keys(params).length === 0) return base
  const query = new URLSearchParams(params).toString()
  return `${base}?${query}`
}

/**
 * Check if a deep link requires authentication.
 * Auth-required screens are only accessible when logged in;
 * the auth gate will redirect to login if not authenticated.
 */
export function requiresAuth(route: string): boolean {
  return route.startsWith('/(app)/')
}
