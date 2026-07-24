/**
 * React Query hooks for in-app notifications.
 *
 * Used by the Dashboard bell (unread badge) and the Notifications screen (inbox).
 * Falls back to a small local seed when the backend is unreachable so the UI
 * always has something to show (the bell still works offline-ish).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  inAppNotificationsService,
  type InAppNotification,
  type InboxResponse,
} from '../services/inAppNotifications'

/** A friendly fallback so the bell + screen render even before the backend ships. */
const SEED: InAppNotification[] = [
  {
    id: 'seed-1',
    audience: 'SYSTEM',
    type: 'system',
    title: 'Welcome to JobPrep 👋',
    body: 'Sync the Interview Library to get 700 practice questions across 70 decks.',
    emoji: '👋',
    cta: 'Open library',
    targetScreen: 'library',
    readAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-2',
    audience: 'DEV',
    type: 'dev',
    title: 'New: Mock Interview Week 🎤',
    body: 'Free AI-scored mock interviews for all members this week. Tap to try one.',
    emoji: '🎤',
    cta: 'Start mock',
    targetScreen: 'practice',
    readAt: null,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-3',
    audience: 'BROADCAST',
    type: 'deck',
    title: 'New deck: React Internals 🧩',
    body: '10 hard questions curated for senior frontend roles.',
    emoji: '🧩',
    cta: 'Open deck',
    targetScreen: 'library',
    readAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
]

function withSeed(res: InboxResponse | null | undefined): InboxResponse {
  if (res && res.items && res.items.length >= 0) return res
  const unreadCount = SEED.filter((s) => !s.readAt).length
  return { items: SEED, unreadCount }
}

export function useInbox(unreadOnly = false) {
  return useQuery<InboxResponse>({
    queryKey: ['notifications', 'inbox', unreadOnly],
    queryFn: async () => {
      try {
        const data = await inAppNotificationsService.getInbox(unreadOnly)
        return data
      } catch {
        // Backend unavailable — return seed so the screen isn't empty.
        return withSeed(null)
      }
    },
    staleTime: 30_000,
  })
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        return await inAppNotificationsService.getUnreadCount()
      } catch {
        return SEED.filter((s) => !s.readAt).length
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => inAppNotificationsService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => inAppNotificationsService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
