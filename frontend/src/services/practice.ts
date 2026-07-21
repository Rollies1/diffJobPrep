import { api } from './api'
import type {
  StartSessionRequest,
  SessionState,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SessionResult,
  SyncPayload,
} from '../types/api'

export const practiceService = {
  /** POST /practice/sessions — start a new practice session. */
  start: async (body: StartSessionRequest): Promise<SessionState> => {
    const { data } = await api.post<SessionState>('/practice/sessions', body)
    return data
  },

  /** GET /practice/sessions/{sessionId} — current state. */
  getState: async (sessionId: string): Promise<SessionState> => {
    const { data } = await api.get<SessionState>(`/practice/sessions/${sessionId}`)
    return data
  },

  /** POST /practice/sessions/{sessionId}/answers — submit an answer. */
  submitAnswer: async (
    sessionId: string,
    body: SubmitAnswerRequest,
    idempotencyKey?: string
  ): Promise<SubmitAnswerResponse> => {
    const config = idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}
    const { data } = await api.post<SubmitAnswerResponse>(
      `/practice/sessions/${sessionId}/answers`,
      body,
      config
    )
    return data
  },

  /** POST /practice/sessions/{sessionId}/next — advance to next question. */
  next: async (sessionId: string): Promise<{ questionId: string; index: number } | null> => {
    const { data } = await api.post(`/practice/sessions/${sessionId}/next`)
    return data
  },

  /** POST /practice/sessions/{sessionId}/complete — finalize + get result. */
  complete: async (sessionId: string): Promise<SessionResult> => {
    const { data } = await api.post<SessionResult>(`/practice/sessions/${sessionId}/complete`)
    return data
  },

  /** POST /practice/sessions/{sessionId}/abandon — abandon (204). */
  abandon: async (sessionId: string): Promise<void> => {
    await api.post(`/practice/sessions/${sessionId}/abandon`)
  },

  /** POST /practice/sync — sync an offline session. */
  syncOffline: async (body: SyncPayload): Promise<SessionResult> => {
    const { data } = await api.post<SessionResult>('/practice/sync', body)
    return data
  },
}
