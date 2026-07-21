import { useSyncStore } from '../src/store/useSyncStore'
import { offlineQueue } from '../src/services/offlineQueue'
import AsyncStorage from '@react-native-async-storage/async-storage'

describe('useSyncStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    useSyncStore.setState({ pendingCount: 0, isSyncing: false, lastSyncedAt: null, lastError: null })
  })

  it('starts with zero pending', () => {
    expect(useSyncStore.getState().pendingCount).toBe(0)
    expect(useSyncStore.getState().isSyncing).toBe(false)
  })

  it('refreshCount reads from the queue', async () => {
    await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a1', durationMs: 1000 })
    await useSyncStore.getState().refreshCount()
    expect(useSyncStore.getState().pendingCount).toBe(1)
  })

  it('enqueue adds to the queue and refreshes the count', async () => {
    await useSyncStore.getState().enqueue('complete_session', { sessionId: 's1' })
    expect(useSyncStore.getState().pendingCount).toBe(1)

    await useSyncStore.getState().enqueue('abandon_session', { sessionId: 's2' })
    expect(useSyncStore.getState().pendingCount).toBe(2)
  })

  it('clear empties the queue and resets state', async () => {
    await useSyncStore.getState().enqueue('submit_answer', { sessionId: 's1', answerText: 'a1', durationMs: 1000 })
    await useSyncStore.getState().clear()

    expect(useSyncStore.getState().pendingCount).toBe(0)
    expect(useSyncStore.getState().lastSyncedAt).toBeNull()
    expect(useSyncStore.getState().lastError).toBeNull()
  })

  it('setSyncing + setLastSynced + setError update state', () => {
    useSyncStore.getState().setSyncing(true)
    expect(useSyncStore.getState().isSyncing).toBe(true)

    useSyncStore.getState().setLastSynced(Date.now())
    expect(useSyncStore.getState().lastSyncedAt).toBeTruthy()
    expect(useSyncStore.getState().lastError).toBeNull()

    useSyncStore.getState().setError('Sync failed')
    expect(useSyncStore.getState().lastError).toBe('Sync failed')
  })
})
