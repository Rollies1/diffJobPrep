import { create } from 'zustand'
import { offlineQueue, type SyncItem } from '../services/offlineQueue'

type SyncState = {
  pendingCount: number
  isSyncing: boolean
  lastSyncedAt: number | null
  lastError: string | null

  refreshCount: () => Promise<void>
  setSyncing: (syncing: boolean) => void
  setLastSynced: (timestamp: number) => void
  setError: (error: string | null) => void
  /** Enqueue an item and refresh the count. */
  enqueue: (type: SyncItem['type'], payload: Record<string, unknown>) => Promise<void>
  /** Clear the queue (on logout). */
  clear: () => Promise<void>
}

export const useSyncStore = create<SyncState>((set, get) => ({
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  lastError: null,

  refreshCount: async () => {
    const count = await offlineQueue.count()
    set({ pendingCount: count })
  },

  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSynced: (timestamp) => set({ lastSyncedAt: timestamp, lastError: null }),
  setError: (error) => set({ lastError: error }),

  enqueue: async (type, payload) => {
    await offlineQueue.enqueue(type, payload)
    await get().refreshCount()
  },

  clear: async () => {
    await offlineQueue.clear()
    set({ pendingCount: 0, lastSyncedAt: null, lastError: null })
  },
}))
