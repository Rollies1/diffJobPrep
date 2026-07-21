import { useEffect, useCallback } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import {
  getPendingActions,
  clearPendingActions,
  markSynced,
  getSessionsByStatus,
  updateSessionStatus,
  scheduleRetry
} from '@/utils/database/repository';
import apiClient from '@/services/apiClient';
import { practiceService } from '@/services/practiceService';

export function useSyncEngine() {
  const netInfo = useNetInfo();
  const queryClient = useQueryClient();

  const flush = useCallback(async () => {
    const actions = await getPendingActions();
    if (actions.length === 0) return;

    try {
      const { data } = await apiClient.post('/questions/sync', {
        clientLastSyncTimestamp: null,
        actions: actions.map((a) => ({
          actionId: a.action_id,
          type: a.action_type,
          questionId: a.target_id,
          payload: JSON.parse(a.payload),
          clientTimestamp: a.client_timestamp,
        })),
        deviceId: 'unknown', // Replace with expo-device ID
      });

      await clearPendingActions(data.acknowledgedActionIds);
      await markSynced(
        data.acknowledgedActionIds.map((id: string) => {
          const action = actions.find((a) => a.action_id === id);
          return action?.target_id;
        }).filter(Boolean),
        'user_question_state'
      );

      // Refresh all dependent queries
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      // Replay Offline Practice Sessions
      const offlineSessions = await getSessionsByStatus('SYNC_QUEUED');
      for (const session of offlineSessions) {
        if (!session.completedAt) continue;

        try {
          const payload = {
            clientSessionId: session.clientSessionId,
            deckId: session.deckId,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            answers: JSON.parse(session.answers || '[]').map((ans: any) => ({
              questionId: ans.questionId,
              selectedOption: ans.selectedOption,
              answerText: ans.answerText,
              timeSpentMs: ans.durationMs
            }))
          };

          await practiceService.syncOfflineSessions(payload);
          await updateSessionStatus(session.clientSessionId, 'SYNCED');
        } catch (err: any) {
          console.error('[SyncEngine] Replay session failed:', err);
          await scheduleRetry(session.clientSessionId);
        }
      }
      
    } catch (err) {
      console.error('[SyncEngine] Flush failed:', err);
    }
  }, [queryClient]);

  // Flush when network returns
  useEffect(() => {
    if (netInfo.isConnected) {
      flush();
    }
  }, [netInfo.isConnected, flush]);

  // Flush when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && netInfo.isConnected) {
        flush();
      }
    });
    return () => sub.remove();
  }, [netInfo.isConnected, flush]);

  return { flush, isOnline: !!netInfo.isConnected };
}
