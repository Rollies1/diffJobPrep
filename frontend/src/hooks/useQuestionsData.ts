import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  getDecks,
  getQuestionsByDeck,
  upsertDecks,
  upsertQuestions,
  toggleBookmark,
  getPendingActions,
  clearPendingActions,
  markSynced,
} from '@/utils/database/repository';
import apiClient from '@/services/apiClient';
import { questionService } from '@/services/questionService';
import { useOfflineStore } from '@/stores/useOfflineStore';

// ─── Decks ───────────────────────────────────────────────
export function useDecks() {
  const netInfo = useNetInfo();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      // Always return local data immediately
      const local = await getDecks();
      
      // If online, fetch server delta in background
      if (netInfo.isConnected) {
        questionService.getDecks().then((data) => {
          upsertDecks(data.map(d => ({
            id: d.id,
            title: d.title || 'Untitled',
            category: d.category || 'General',
            color: d.color || '#00d4ff',
            question_count: d.questionCount || 0,
            completed_count: d.completedCount || 0,
            is_synced: 1
          }))).then(() => {
            queryClient.invalidateQueries({ queryKey: ['decks'] });
          });
        });
      }
      
      return local;
    },
    staleTime: 1000 * 60 * 5,
  });

  return query;
}

// ─── Questions ─────────────────────────────────────────
export function useQuestions(deckId: string) {
  const netInfo = useNetInfo();

  return useQuery({
    queryKey: ['questions', deckId],
    queryFn: async () => {
      const local = await getQuestionsByDeck(deckId);
      
      if (netInfo.isConnected) {
        questionService.getQuestions({ deckId, limit: 100 }).then(({ items }) => {
          if (items.length > 0) {
            upsertQuestions(
              items.map((q) => ({
                id: q.id,
                deck_id: q.deckId!,
                title: q.title!,
                content: q.content!,
                difficulty: q.difficulty!,
                hint: q.hint ?? undefined,
                category: q.category ?? undefined,
                options: q.options ?? undefined,
              }))
            );
          }
        });
      }
      
      return local;
    },
  });
}

// ─── Bookmark Toggle (Offline-First) ────────────────────
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, currentState }: { questionId: string; currentState: boolean }) => {
      // 1. Update SQLite immediately
      const action = await toggleBookmark(questionId, currentState);
      
      // 2. If online, fire-and-forget to server
      const netInfo = await import('@react-native-community/netinfo').then(m => m.default.fetch());
      if (netInfo.isConnected) {
        apiClient.post('/questions/sync', {
          actions: [action],
        }).catch(() => {
          // Server will pick it up on next sync
        });
      }
      
      return action;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

// ─── Background Sync ───────────────────────────────────
export function useBackgroundSync() {
  const netInfo = useNetInfo();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!netInfo.isConnected) return;

    const sync = async () => {
      const actions = await getPendingActions();
      if (actions.length === 0) return;

      try {
        const { data } = await apiClient.post('/questions/sync', {
          clientLastSyncTimestamp: null, // Could store this in metadata table
          actions,
          deviceId: 'unknown', // Replace with actual device ID
        });

        await clearPendingActions(data.acknowledgedActionIds);
        await markSynced(
          actions.map(a => a.target_id),
          'user_question_state'
        );
        
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        queryClient.invalidateQueries({ queryKey: ['questions'] });
      } catch (err) {
        console.error('Sync failed:', err);
      }
    };

    sync();
  }, [netInfo.isConnected]);
}
