import { parseDeepLink, buildDeepLink, requiresAuth } from '../src/services/deepLinks'

describe('deepLinks', () => {
  describe('parseDeepLink', () => {
    it('parses a simple screen URL', () => {
      const result = parseDeepLink('jobprep://dashboard')
      expect(result).toEqual({ route: '/(app)/dashboard', params: {} })
    })

    it('parses a URL with path params (deck)', () => {
      const result = parseDeepLink('jobprep://deck/abc123')
      expect(result).toEqual({ route: '/(app)/deck/[id]', params: { id: 'abc123' } })
    })

    it('parses a URL with path params (question)', () => {
      const result = parseDeepLink('jobprep://question/xyz789')
      expect(result).toEqual({ route: '/(app)/question/[id]', params: { id: 'xyz789' } })
    })

    it('parses a URL with query params', () => {
      const result = parseDeepLink('jobprep://practice?deckId=abc123&mode=quick')
      expect(result).toEqual({
        route: '/(app)/practice',
        params: { deckId: 'abc123', mode: 'quick' },
      })
    })

    it('parses universal links (https)', () => {
      const result = parseDeepLink('https://jobprep.app/deck/abc123')
      expect(result).toEqual({ route: '/(app)/deck/[id]', params: { id: 'abc123' } })
    })

    it('defaults to dashboard for unknown screens', () => {
      const result = parseDeepLink('jobprep://unknown-screen')
      expect(result).toEqual({ route: '/(app)/dashboard', params: {} })
    })

    it('returns null for invalid URLs', () => {
      expect(parseDeepLink('not-a-url')).toBeNull()
    })
  })

  describe('buildDeepLink', () => {
    it('builds a simple URL', () => {
      expect(buildDeepLink('practice')).toBe('jobprep://practice')
    })

    it('builds a URL with params', () => {
      const url = buildDeepLink('deck', { id: 'abc123', title: 'Two Pointers' })
      expect(url).toContain('jobprep://deck')
      expect(url).toContain('id=abc123')
      expect(url).toContain('title=Two+Pointers')
    })
  })

  describe('requiresAuth', () => {
    it('returns true for app routes', () => {
      expect(requiresAuth('/(app)/dashboard')).toBe(true)
      expect(requiresAuth('/(app)/library')).toBe(true)
      expect(requiresAuth('/(app)/deck/[id]')).toBe(true)
    })

    it('returns false for auth routes', () => {
      expect(requiresAuth('/(auth)/login')).toBe(false)
      expect(requiresAuth('/(auth)/register')).toBe(false)
    })
  })
})
