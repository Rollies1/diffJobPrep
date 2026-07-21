import AsyncStorage from '@react-native-async-storage/async-storage'
import { offlineQueue } from '../src/services/offlineQueue'

const QUEUE_KEY = 'jp_sync_queue'

describe('offlineQueue', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  describe('enqueue + getAll', () => {
    it('starts empty', async () => {
      const items = await offlineQueue.getAll()
      expect(items).toEqual([])
    })

    it('enqueues an item', async () => {
      const item = await offlineQueue.enqueue('submit_answer', {
        sessionId: 's1',
        answerText: 'hash map',
        durationMs: 5000,
      })
      expect(item.type).toBe('submit_answer')
      expect(item.payload).toEqual({ sessionId: 's1', answerText: 'hash map', durationMs: 5000 })
      expect(item.attempts).toBe(0)
      expect(item.id).toBeTruthy()

      const all = await offlineQueue.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].id).toBe(item.id)
    })

    it('enqueues multiple items in order', async () => {
      await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a1', durationMs: 1000 })
      await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a2', durationMs: 2000 })
      await offlineQueue.enqueue('complete_session', { sessionId: 's1' })

      const all = await offlineQueue.getAll()
      expect(all).toHaveLength(3)
      expect(all[0].payload.answerText).toBe('a1')
      expect(all[1].payload.answerText).toBe('a2')
      expect(all[2].type).toBe('complete_session')
    })
  })

  describe('remove', () => {
    it('removes an item by id', async () => {
      const item1 = await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a1', durationMs: 1000 })
      const item2 = await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a2', durationMs: 2000 })

      await offlineQueue.remove(item1.id)

      const all = await offlineQueue.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].id).toBe(item2.id)
    })
  })

  describe('markFailed', () => {
    it('increments attempts and stores the error', async () => {
      const item = await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a1', durationMs: 1000 })

      await offlineQueue.markFailed(item.id, 'Network error')
      const all = await offlineQueue.getAll()
      expect(all[0].attempts).toBe(1)
      expect(all[0].lastError).toBe('Network error')

      await offlineQueue.markFailed(item.id, 'Timeout')
      const updated = await offlineQueue.getAll()
      expect(updated[0].attempts).toBe(2)
      expect(updated[0].lastError).toBe('Timeout')
    })
  })

  describe('prune', () => {
    it('removes items that exceeded the max attempts', async () => {
      const item1 = await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a1', durationMs: 1000 })
      const item2 = await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a2', durationMs: 2000 })

      // Fail item1 6 times (exceeds max of 5)
      for (let i = 0; i < 6; i++) {
        await offlineQueue.markFailed(item1.id, 'error')
      }

      await offlineQueue.prune(5)

      const all = await offlineQueue.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].id).toBe(item2.id)
    })
  })

  describe('clear + count', () => {
    it('counts pending items', async () => {
      await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a1', durationMs: 1000 })
      await offlineQueue.enqueue('complete_session', { sessionId: 's1' })
      expect(await offlineQueue.count()).toBe(2)
    })

    it('clears all items', async () => {
      await offlineQueue.enqueue('submit_answer', { sessionId: 's1', answerText: 'a1', durationMs: 1000 })
      await offlineQueue.enqueue('complete_session', { sessionId: 's1' })

      await offlineQueue.clear()

      expect(await offlineQueue.count()).toBe(0)
      expect(await offlineQueue.getAll()).toEqual([])
    })
  })
})
