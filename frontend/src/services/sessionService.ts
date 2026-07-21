import apiClient from './apiClient';
import { adaptCursorPage } from './adapters/springPageAdapter';

export interface UserStats {
  weeklyGoal: number; // 0.0 - 1.0
  completionRate: number; // 0.0 - 1.0
  streakDays: number;
  totalAnswered: number;
  weeklySessions: number;
  weeklyQuestions: number;
  skillBreakdown: Record<string, number>;
  totalXp: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  rankName: string;
}

export interface SessionHistoryItem {
  sessionId: string;
  deckId: string;
  deckName: string | null;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  durationMs: number;
  xpEarned: number;
  completedAt: string;
}

export interface DailyActivityDto {
  date: string;
  sessionsCompleted: number;
  questionsAnswered: number;
  timeSpentSeconds: number;
  scoreSum: number;
  xpEarned: number;
}

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Paginated<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

import { useAuthStore } from '../store/useAuthStore';
import { 
  getUserStats, upsertUserStats,
  getSessionHistory, upsertSessionHistory,
  getDailyActivity, upsertDailyActivity
} from '../utils/database/repository';
import NetInfo from '@react-native-community/netinfo';

export const sessionService = {
  getStats: async () => {
    const netInfo = await NetInfo.fetch();
    const userId = useAuthStore.getState().user?.id;

    if (netInfo.isConnected) {
      try {
        const res = await apiClient.get<UserStats>('/sessions/stats');
        const data = res.data;
        if (userId) {
          await upsertUserStats(userId, data);
        }
        return data;
      } catch (err) {
        console.warn('Failed to fetch user stats from backend, falling back to cache', err);
      }
    }

    if (userId) {
      const cached = await getUserStats(userId);
      if (cached) {
        return {
          weeklyGoal: cached.weekly_goal,
          completionRate: cached.completion_rate,
          streakDays: cached.streak_days,
          totalAnswered: cached.total_answered,
          weeklySessions: cached.weekly_sessions,
          weeklyQuestions: cached.weekly_questions,
          skillBreakdown: JSON.parse(cached.skill_breakdown),
          totalXp: cached.total_xp,
          currentLevel: cached.current_level,
          xpInCurrentLevel: cached.xp_in_current_level,
          xpToNextLevel: cached.xp_to_next_level,
          rankName: cached.rank_name
        } as UserStats;
      }
    }
    
    throw new Error('No internet connection and no cached stats available');
  },

  getHistory: async (cursor?: string, limit: number = 20) => {
    const netInfo = await NetInfo.fetch();

    if (netInfo.isConnected) {
      try {
        const res = await apiClient.get<CursorPage<SessionHistoryItem>>('/sessions/history', {
          params: { cursor, limit },
        });
        const adapted = adaptCursorPage(res.data);
        if (!cursor) {
          // Only cache the first page
          await upsertSessionHistory(adapted.items);
        }
        return adapted;
      } catch (err) {
        console.warn('Failed to fetch history from backend, falling back to cache', err);
      }
    }

    // Offline fallback (only returns local cached items, pagination might be limited)
    const cached = await getSessionHistory();
    const mapped: SessionHistoryItem[] = cached.map(row => ({
      sessionId: row.session_id,
      deckId: row.deck_id,
      deckName: row.deck_name,
      score: row.score,
      totalQuestions: row.total_questions,
      answeredQuestions: row.answered_questions,
      durationMs: row.duration_ms,
      xpEarned: row.xp_earned,
      completedAt: row.completed_at
    }));

    return {
      items: mapped,
      nextCursor: null,
      hasMore: false
    };
  },

  getActivity: async (days: number = 7) => {
    const netInfo = await NetInfo.fetch();

    if (netInfo.isConnected) {
      try {
        const res = await apiClient.get<DailyActivityDto[]>('/sessions/activity', {
          params: { days },
        });
        await upsertDailyActivity(res.data);
        return res.data;
      } catch (err) {
        console.warn('Failed to fetch activity from backend, falling back to cache', err);
      }
    }

    const cached = await getDailyActivity();
    return cached.map(row => ({
      date: row.date,
      sessionsCompleted: row.sessions_completed,
      questionsAnswered: row.questions_answered,
      timeSpentSeconds: row.time_spent_seconds,
      scoreSum: row.score_sum,
      xpEarned: row.xp_earned
    } as DailyActivityDto));
  },
};
