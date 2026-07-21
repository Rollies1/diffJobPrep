import { api } from './api'
import type {
  UserStats,
  SessionHistoryItem,
  CursorPage,
  DailyActivityDto,
} from '../types/api'

export const statsService = {
  /** GET /sessions/stats — aggregate user stats for dashboard. */
  getStats: async (): Promise<UserStats> => {
    const { data } = await api.get<UserStats>('/sessions/stats')
    return data
  },

  /** GET /sessions/history?cursor=&limit=20 — cursor-paginated history. */
  getHistory: async (
    cursor?: string | null,
    limit = 20
  ): Promise<CursorPage<SessionHistoryItem>> => {
    const { data } = await api.get<CursorPage<SessionHistoryItem>>('/sessions/history', {
      params: { cursor: cursor ?? undefined, limit },
    })
    return data
  },

  /** GET /sessions/activity?days=7 — daily activity for heatmap/chart. */
  getActivity: async (days = 7): Promise<DailyActivityDto[]> => {
    const { data } = await api.get<DailyActivityDto[]>('/sessions/activity', {
      params: { days },
    })
    return data
  },
}
