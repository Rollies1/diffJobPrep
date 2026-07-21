import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { toggleBookmark } from '@/utils/database/repository';
import apiClient from '@/services/apiClient';
import { useOfflineStore } from '@/stores/useOfflineStore';

interface BookmarkVars {
  questionId: string;
  currentState: boolean;
}

export function useBookmarkQuestion() {
  const queryClient = useQueryClient();
  const netInfo = useNetInfo();
  const { enqueue } = useOfflineStore();

  return useMutation({
    mutationFn: async ({ questionId, currentState }: BookmarkVars) => {
      // 1. Immediate SQLite update + action log
      const action = await toggleBookmark(questionId, currentState);

      // 2. If online, attempt immediate server sync
      if (netInfo.isConnected) {
        try {
          await apiClient.post('/questions/sync', {
            actions: [action],
          });
          // Server acknowledged; action already in DB, will be cleared by sync
        } catch {
          // Will retry on next sync cycle
        }
      } else {
        // Offline: ensure action is in Zustand store for UI queue display
        enqueue({
          actionId: action.action_id,
          type: action.action_type,
          payload: JSON.parse(action.payload),
          timestamp: Date.now(),
        });
      }

      return { questionId, newState: !currentState };
    },

    // Optimistic update: flip the cache before network
    onMutate: async ({ questionId, currentState }) => {
      await queryClient.cancelQueries({ queryKey: ['questions'] });
      const previous = queryClient.getQueryData(['questions']);

      queryClient.setQueriesData({ queryKey: ['questions'] }, (old: any) => {
        if (!old) return old;
        return old.map((q: any) =>
          q.id === questionId ? { ...q, bookmarked: !currentState } : q
        );
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['questions'], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}
