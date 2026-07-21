import NetInfo from '@react-native-community/netinfo'
import { QueryClient } from '@tanstack/react-query'
import { offlineQueue, type SyncItem } from '../services/offlineQueue'
import { practiceService } from '../services/practice'
import { questionService } from '../services/questions'
import { useSyncStore } from '../store/useSyncStore'

const MAX_ATTEMPTS = 5

export class SyncEngine {
  private queryClient: QueryClient
  private unsubscribe: (() => void) | null = null
  private isRunning = false

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /** Start listening for connectivity changes and auto-sync. */
  start() {
    // Sync on mount (in case items were queued while the app was killed).
    this.sync()

    // Listen for connectivity restore.
    this.unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        this.sync()
      }
    })
  }

  /** Stop listening. */
  stop() {
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  /** Process all pending items in the queue. */
  async sync() {
    if (this.isRunning) return
    const store = useSyncStore.getState()
    if (store.pendingCount === 0) return

    this.isRunning = true
    store.setSyncing(true)
    store.setError(null)

    try {
      // Prune items that have exceeded the retry limit.
      await offlineQueue.prune(MAX_ATTEMPTS)

      const items = await offlineQueue.getAll()

      // Batch question-state items into a single sync request.
      const questionStateItems = items.filter((i) => i.type === 'question_state')
      const otherItems = items.filter((i) => i.type !== 'question_state')

      // Process non-batch items sequentially (order matters for sessions).
      for (const item of otherItems) {
        await this.processItem(item)
      }

      // Process question-state items as a single batch.
      if (questionStateItems.length > 0) {
        await this.processQuestionStateBatch(questionStateItems)
      }

      // Invalidate caches so the UI reflects synced data.
      await this.queryClient.invalidateQueries({ queryKey: ['stats'] })
      await this.queryClient.invalidateQueries({ queryKey: ['history'] })
      await this.queryClient.invalidateQueries({ queryKey: ['activity'] })
      await this.queryClient.invalidateQueries({ queryKey: ['decks'] })

      useSyncStore.getState().setLastSynced(Date.now())
    } catch (e) {
      useSyncStore.getState().setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      this.isRunning = false
      store.setSyncing(false)
      await useSyncStore.getState().refreshCount()
    }
  }

  /** Process a single sync item. */
  private async processItem(item: SyncItem): Promise<void> {
    try {
      switch (item.type) {
        case 'submit_answer': {
          const { sessionId, answerText, durationMs, confidence, idempotencyKey } = item.payload as {
            sessionId: string
            answerText: string
            durationMs: number
            confidence?: number
            idempotencyKey?: string
          }
          await practiceService.submitAnswer(sessionId, { answerText, durationMs, confidence }, idempotencyKey)
          break
        }
        case 'complete_session': {
          const { sessionId } = item.payload as { sessionId: string }
          await practiceService.complete(sessionId)
          break
        }
        case 'abandon_session': {
          const { sessionId } = item.payload as { sessionId: string }
          await practiceService.abandon(sessionId)
          break
        }
      }
      await offlineQueue.remove(item.id)
    } catch (e) {
      await offlineQueue.markFailed(item.id, e instanceof Error ? e.message : 'Unknown error')
    }
  }

  /** Process question-state items as a single batch sync request. */
  private async processQuestionStateBatch(items: SyncItem[]): Promise<void> {
    const changes = items.map((item) => ({
      questionId: item.payload.questionId as string,
      bookmarked: item.payload.bookmarked as boolean | undefined,
      completed: item.payload.completed as boolean | undefined,
      rating: item.payload.rating as number | undefined,
      notes: item.payload.notes as string | undefined,
    }))

    try {
      await questionService.sync({ changes })
      // Remove all successfully synced items.
      for (const item of items) {
        await offlineQueue.remove(item.id)
      }
    } catch (e) {
      // Mark all as failed (will retry next sync).
      for (const item of items) {
        await offlineQueue.markFailed(item.id, e instanceof Error ? e.message : 'Batch sync failed')
      }
    }
  }
}
