import NetInfo from '@react-native-community/netinfo'
import * as Crypto from 'expo-crypto'
import { practiceService } from './practice'
import { questionService } from './questions'
import { offlineQueue } from './offlineQueue'
import { useSyncStore } from '../store/useSyncStore'

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return state.isConnected === true && state.isInternetReachable !== false
}

export const offlinePractice = {
  /** Submit an answer — direct if online, queued if offline. */
  async submitAnswer(
    sessionId: string,
    body: { answerText: string; durationMs: number; confidence?: number }
  ): Promise<{ accepted: boolean; nextAvailable: boolean; pending: boolean }> {
    const idempotencyKey = Crypto.randomUUID()
    
    if (await isOnline()) {
      const res = await practiceService.submitAnswer(sessionId, body, idempotencyKey)
      return { ...res, pending: false }
    }
    // Offline: enqueue for later sync.
    await useSyncStore.getState().enqueue('submit_answer', {
      sessionId,
      answerText: body.answerText,
      durationMs: body.durationMs,
      confidence: body.confidence,
      idempotencyKey,
    })
    return { accepted: true, nextAvailable: true, pending: true }
  },

  /** Complete a session — direct if online, queued if offline. */
  async complete(sessionId: string): Promise<{ pending: boolean }> {
    if (await isOnline()) {
      await practiceService.complete(sessionId)
      return { pending: false }
    }
    await useSyncStore.getState().enqueue('complete_session', { sessionId })
    return { pending: true }
  },

  /** Abandon a session — direct if online, queued if offline. */
  async abandon(sessionId: string): Promise<{ pending: boolean }> {
    if (await isOnline()) {
      await practiceService.abandon(sessionId)
      return { pending: false }
    }
    await useSyncStore.getState().enqueue('abandon_session', { sessionId })
    return { pending: true }
  },
}

export const offlineQuestions = {
  /** Update question state (bookmark/rating/notes/completion) — batched sync. */
  async updateState(change: {
    questionId: string
    bookmarked?: boolean
    completed?: boolean
    rating?: number
    notes?: string
  }): Promise<{ pending: boolean }> {
    if (await isOnline()) {
      await questionService.sync({ changes: [change] })
      return { pending: false }
    }
    await useSyncStore.getState().enqueue('question_state', change)
    return { pending: true }
  },
}
