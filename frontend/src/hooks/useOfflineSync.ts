import { useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import apiClient from '@/services/apiClient';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { getDatabase } from '@/utils/database/connection';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

interface SyncPayload {
  clientLastSyncTimestamp: string | null;
  actions: PendingAction[];
  deviceId: string;
}

interface PendingAction {
  actionId: string;
  type: string;
  questionId?: string;
  payload: Record<string, unknown>;
  clientTimestamp: number;
}

export function useOfflineSync() {
  const queryClient = useQueryClient();

  const { pendingActions, clearAcknowledged } = useOfflineStore();

  const syncMutation = useMutation({
    mutationFn: async (payload: SyncPayload) => {
      const { data } = await apiClient.post('/questions/sync', payload);
      return data;
    },
    onSuccess: (data) => {
      // Remove acknowledged actions from SQLite
      if (data.acknowledgedActionIds?.length > 0) {
        clearAcknowledged(data.acknowledgedActionIds);
      }
      // Apply server-side changes to local cache
      if (data.serverChanges?.length > 0) {
        queryClient.setQueryData(['decks'], (old: any) => {
          // Merge serverChanges into local deck state
          return mergeServerChanges(old, data.serverChanges);
        });
      }
    },
  });

  const flushQueue = useCallback(async () => {
    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected || syncMutation.isPending) return;

    const db = await getDatabase();
    const actions = await db.getAllAsync<PendingAction>(
      'SELECT * FROM pending_actions ORDER BY client_timestamp ASC'
    );

    if (actions.length === 0) return;

    const lastSync = await SecureStore.getItemAsync('last_sync_timestamp');

    syncMutation.mutate({
      clientLastSyncTimestamp: lastSync,
      actions,
      deviceId: await SecureStore.getItemAsync('device_id') ?? 'unknown',
    });

    await SecureStore.setItemAsync('last_sync_timestamp', new Date().toISOString());
  }, [syncMutation]);


  // Auto-flush when network returns
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isInternetReachable ?? state.isConnected ?? true;
      if (online) {
        flushQueue();
      }
    });
    return () => unsubscribe();
  }, [flushQueue]);

  return { flushQueue, isSyncing: syncMutation.isPending, syncError: syncMutation.error };
}

function mergeServerChanges(oldData: any, changes: any[]) {
  // Implement based on your DTO shape
  return oldData; 
}
