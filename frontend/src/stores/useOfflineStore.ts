import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PendingAction {
  actionId: string;
  type: string;
  endpoint?: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

interface OfflineState {
  pendingActions: PendingAction[];
  enqueue: (action: PendingAction) => void;
  clearAcknowledged: (actionIds: string[]) => void;
  clearAll: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      pendingActions: [],
      enqueue: (action) =>
        set((state) => ({
          pendingActions: [...state.pendingActions, action],
        })),
      clearAcknowledged: (actionIds) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter(
            (a) => !actionIds.includes(a.actionId)
          ),
        })),
      clearAll: () => set({ pendingActions: [] }),
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
