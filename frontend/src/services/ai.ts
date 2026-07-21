import { api } from './api'
import type { EvaluationRequest, EvaluationResponse } from '../types/api'

export const aiService = {
  /** POST /ai/evaluate — evaluate an answer (strengths/weaknesses/score). */
  evaluate: async (body: EvaluationRequest): Promise<EvaluationResponse> => {
    const { data } = await api.post<EvaluationResponse>('/ai/evaluate', body)
    return data
  },

  /** POST /ai/cv/generate — returns PDF bytes. */
  generateCv: async (body: unknown): Promise<ArrayBuffer> => {
    const { data } = await api.post('/ai/cv/generate', body, {
      responseType: 'arraybuffer',
    })
    return data
  },
}
