import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/utils/database/connection';
import apiClient from '@/services/apiClient';
import { usePracticeStore } from '@/stores/practiceStore';

interface CompleteVars {
  questionId: string;
  deckId: string;
  durationMs?: number;
}

export function useCompleteQuestion() {
  const queryClient = useQueryClient();
  const netInfo = useNetInfo();

  return useMutation({
    mutationFn: async ({ questionId, deckId, durationMs }: CompleteVars) => {
      const db = await getDatabase();

      // 1. Local state update
      await db.runAsync(
        `INSERT INTO user_question_state (question_id, completed, last_practiced_at, is_synced)
         VALUES ($id, 1, $now, 0)
         ON CONFLICT(question_id) DO UPDATE SET
           completed = 1,
           last_practiced_at = excluded.last_practiced_at,
           is_synced = 0`,
        { $id: questionId, $now: new Date().toISOString() }
      );

      const action = {
        actionId: Crypto.randomUUID(),
        actionType: 'QUESTION_COMPLETE' as const,
        targetId: questionId,
        payload: JSON.stringify({ durationMs }),
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

      // 2. Server sync if online
      if (netInfo.isConnected) {
        // Push offline state sync
        apiClient.post('/questions/sync', { actions: [action] }).catch(() => {});
        
        // Push active session answer if in a session
        const sessionId = usePracticeStore.getState().sessionId;
        if (sessionId) {
          apiClient.post(`/sessions/${sessionId}/answers`, {
            questionId,
            answerText: 'completed', // Dummy text since we just care about completion
            durationMs: durationMs || 0
          }).catch(err => console.log('Session sync failed:', err));
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { questionId, deckId };
    },

    onMutate: async ({ questionId }) => {
      await queryClient.cancelQueries({ queryKey: ['questions'] });
      const previous = queryClient.getQueryData(['questions']);

      queryClient.setQueriesData({ queryKey: ['questions'] }, (old: any) => {
        if (!old) return old;
        return old.map((q: any) =>
          q.id === questionId ? { ...q, completed: true } : q
        );
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['questions'], context.previous);
      }
    },

    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['questions', vars.deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
