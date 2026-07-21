/**
 * Auth store — Zustand. Aligns with your existing useAuthStore.
 * Holds the current user + token state; persists tokens via storage.ts.
 */
import { create } from 'zustand'
import type { UserDto } from '../types/api'
import { storage } from '../services/storage'

interface AuthState {
  user: UserDto | null
  isAuthenticated: boolean
  isHydrated: boolean

  hydrate: () => Promise<void>
  setAuth: (user: UserDto, accessToken: string, refreshToken: string) => Promise<void>
  updateUser: (patch: Partial<UserDto>) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  hydrate: async () => {
    const access = await storage.getAccessToken()
    const userJson = await storage.getUser()
    if (access && userJson) {
      try {
        const user = JSON.parse(userJson) as UserDto
        set({ user, isAuthenticated: true, isHydrated: true })
        return
      } catch {
        await storage.clearAll()
      }
    }
    set({ user: null, isAuthenticated: false, isHydrated: true })
  },

  setAuth: async (user, accessToken, refreshToken) => {
    await storage.setTokens(accessToken, refreshToken)
    await storage.setUser(JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  updateUser: (patch) => {
    const current = get().user
    if (!current) return
    const next = { ...current, ...patch }
    set({ user: next })
    void storage.setUser(JSON.stringify(next))
  },

  logout: async () => {
    await storage.clearAll()
    set({ user: null, isAuthenticated: false })
  },
}))
