/**
 * In-app notification service — powers the home bell + Notifications screen.
 *
 * Backend contract (notificationservice, port 8083 via gateway /api/notifications):
 *   GET  /notifications/inbox?unreadOnly=false  → { items: InAppNotification[], unreadCount: number }
 *   GET  /notifications/unread-count            → { count: number }
 *   POST /notifications/{id}/read               → { ok: true }
 *   POST /notifications/read-all                → { ok: true, count: number }
 *
 * All calls go through the shared `api` axios instance (JWT attached, gateway base).
 * If the backend isn't reachable, callers gracefully fall back to local seed/mock
 * data so the bell + screen still render something useful.
 */
import { api } from './api'

export type NotificationAudience = 'USER' | 'BROADCAST' | 'SYSTEM' | 'DEV'

export interface InAppNotification {
  id: string
  audience: NotificationAudience
  type: string // tutor | achievement | streak | social | rank | deck | system | dev | ...
  title: string
  body: string
  emoji?: string | null
  avatar?: string | null
  cta?: string | null
  targetScreen?: string | null
  targetParams?: Record<string, string> | null
  readAt?: string | null
  createdAt: string
}

export interface InboxResponse {
  items: InAppNotification[]
  unreadCount: number
}

/** Relative time label like "2m", "1h", "Yesterday". */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'Yesterday'
  if (day < 7) return `${day}d`
  return new Date(iso).toLocaleDateString()
}

export const inAppNotificationsService = {
  getInbox: async (unreadOnly = false): Promise<InboxResponse> => {
    const { data } = await api.get<InboxResponse>('/notifications/inbox', {
      params: { unreadOnly },
    })
    return data
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count')
    return data.count ?? 0
  },

  markRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`)
  },

  markAllRead: async (): Promise<number> => {
    const { data } = await api.post<{ ok: boolean; count: number }>('/notifications/read-all')
    return data.count ?? 0
  },
}
