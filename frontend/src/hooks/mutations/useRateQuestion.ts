import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { getDatabase } from '@/utils/database/connection';
import apiClient from '@/services/apiClient';

interface RateVars {
  questionId: string;
  rating: number; // 1-5
}

export function useRateQuestion() {
  const queryClient = useQueryClient();
  const netInfo = useNetInfo();

  return useMutation({
    mutationFn: async ({ questionId, rating }: RateVars) => {
      const db = await getDatabase();

      await db.runAsync(
        `INSERT INTO user_question_state (question_id, rating, is_synced)
         VALUES ($id, $rating, 0)
         ON CONFLICT(question_id) DO UPDATE SET
           rating = excluded.rating,
           is_synced = 0`,
        { $id: questionId, $rating: rating }
      );

      const action = {
        actionId: crypto.randomUUID(),
        actionType: 'RATE_QUESTION' as const,
        targetId: questionId,
        payload: JSON.stringify({ rating }),
        clientTimestamp: new Date().toISOString(),
      };

      await db.runAsync(
        `INSERT INTO pending_actions (action_id, action_type, target_id, payload, client_timestamp)
         VALUES ($aid, $type, $tid, $payload, $ts)`,
        {
          $aid: action.actionId,
          $type: action.actionType,
          $tid: action.targetId,
          $payload: action.payload,
          $ts: action.clientTimestamp,
        }
      );

      if (netInfo.isConnected) {
        apiClient.post('/questions/sync', { actions: [action] }).catch(() => {});
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return { questionId, rating };
    },

    onMutate: async ({ questionId, rating }) => {
      await queryClient.cancelQueries({ queryKey: ['questions'] });
      const previous = queryClient.getQueryData(['questions']);

      queryClient.setQueriesData({ queryKey: ['questions'] }, (old: any) => {
        if (!old) return old;
        return old.map((q: any) =>
          q.id === questionId ? { ...q, rating } : q
        );
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['questions'], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
