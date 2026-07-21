import { api } from './api'
import type {
  DeckDto,
  QuestionDto,
  PaginatedQuestionsResponse,
  SyncRequest,
  SyncResponse,
} from '../types/api'

export const questionService = {
  /** GET /questions/decks — public, no auth required. */
  getDecks: async (): Promise<DeckDto[]> => {
    const { data } = await api.get<DeckDto[]>('/questions/decks')
    return data
  },

  /** GET /questions/decks/{deckId}/questions?cursor=&limit=20 — cursor pagination. */
  getQuestions: async (
    deckId: string,
    cursor?: string | null,
    limit = 20
  ): Promise<PaginatedQuestionsResponse> => {
    const { data } = await api.get<PaginatedQuestionsResponse>(
      `/questions/decks/${deckId}/questions`,
      { params: { cursor: cursor ?? undefined, limit } }
    )
    return data
  },

  /** GET /questions/{questionId} — global data; user state merged client-side. */
  getQuestion: async (questionId: string): Promise<QuestionDto> => {
    const { data } = await api.get<QuestionDto>(`/questions/${questionId}`)
    return data
  },

  /** GET /questions/categories */
  getCategories: async (): Promise<string[]> => {
    const { data } = await api.get<string[]>('/questions/categories')
    return data
  },

  /** POST /questions/sync — batch sync bookmarks/ratings/notes/completion. */
  sync: async (body: SyncRequest): Promise<SyncResponse> => {
    const { data } = await api.post<SyncResponse>('/questions/sync', body)
    return data
  },
}
