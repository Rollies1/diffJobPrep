import AsyncStorage from '@react-native-async-storage/async-storage'

const QUEUE_KEY = 'jp_sync_queue'

export type SyncItemType =
  | 'submit_answer'   // practice session answer
  | 'complete_session' // finalize a practice session
  | 'question_state'   // bookmark / rating / notes / completion
  | 'abandon_session'

export interface SyncItem {
  id: string
  type: SyncItemType
  payload: Record<string, unknown>
  createdAt: number
  attempts: number
  lastError?: string
}

export const offlineQueue = {
  /** Get all pending items (oldest first). */
  getAll: async (): Promise<SyncItem[]> => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as SyncItem[]
    } catch {
      return []
    }
  },

  /** Add an item to the end of the queue. */
  enqueue: async (type: SyncItemType, payload: Record<string, unknown>): Promise<SyncItem> => {
    const queue = await offlineQueue.getAll()
    const item: SyncItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      payload,
      createdAt: Date.now(),
      attempts: 0,
    }
    queue.push(item)
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    return item
  },

  /** Remove an item after successful sync. */
  remove: async (id: string): Promise<void> => {
    const queue = await offlineQueue.getAll()
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter((i) => i.id !== id)))
  },

  /** Mark an item as failed (increment attempts, store error). */
  markFailed: async (id: string, error: string): Promise<void> => {
    const queue = await offlineQueue.getAll()
    const item = queue.find((i) => i.id === id)
    if (item) {
      item.attempts++
      item.lastError = error
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  },

  /** Remove items that have exceeded the max retry count. */
  prune: async (maxAttempts = 5): Promise<void> => {
    const queue = await offlineQueue.getAll()
    const kept = queue.filter((i) => i.attempts < maxAttempts)
    if (kept.length !== queue.length) {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(kept))
    }
  },

  /** Clear the entire queue (e.g., after a full sync, or on logout). */
  clear: async (): Promise<void> => {
    await AsyncStorage.removeItem(QUEUE_KEY)
  },

  /** Get the count of pending items (for the sync indicator badge). */
  count: async (): Promise<number> => {
    const queue = await offlineQueue.getAll()
    return queue.length
  },
}
